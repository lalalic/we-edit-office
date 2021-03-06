#!/usr/bin/env node
const prompts=require("prompts")
const chalk=require("chalk")
const fs=require("fs")
const path=require("path")
const merge=require("lodash.merge")
const { execSync } = require('child_process')

const cwd=process.cwd()
const {
		rc, program, getCloud, tryRequireProject
	}=require("qili-cli").getInstance(require("./cloud"),require("./package.json"))

program
	.usage('[options] <command>')
	.command("init [dest]")
	.description("initialize this we-office plugin project, default dest=.")
	.option("-t, --type <type>","plugin type[loader|input|representation|emitter|stream]",/^(loader|input|representation|emitter|stream)$/i,"emitter")
	.action(function(dest=".", {type}){
		console.log(`initing project as we-office ${chalk.blue(type)} plugin`)
		dest=path.resolve(cwd,dest)

		const project=tryRequireProject(path.resolve(dest,"package.json"))
		const copy=require("ncp").ncp

		function mergePackageJson(read, write, name){
			try{
				let that=tryRequireProject(require.resolve("./template/package.json"))
				let typed=tryRequireProject(require.resolve(`./template/${type}/package.json`))
				let merged=merge({},that, typed, project)

				write.write(JSON.stringify(merged, null, 2))
				write.end()
			}catch(e){
				write.write(JSON.stringify(project, null, 2))
				write.end()
				console.log(chalk.red("package.json merging with error"))
				console.log(chalk.red(e.message))
			}
		}

		copy(path.resolve(__dirname,"template/"+type), dest, {
				clobber:true,
				transform(read,write,{name}){
					name=path.basename(name)
					switch(name){
						case "package.json":
							mergePackageJson(read, write, name)
						break
						default:
							read.pipe(write)
					}
				}
			}, error=>{
			if(error)
				console.log(chalk.red(error.message))
			else {
				console.log("done")
			}
		})
	})


program
	.command("publish [dest]")
	.description("publish only package main file")
	.option("-u, --url <plugin url>","only for test to set plugin url root, such as http://localhost:9080", rc.u||rc.url)
	.option("-d, --dir <plugin dir>","only for test to set plugin directory, such as dist",rc.d||rc.dir)
	.option("-m, --main <plugin code file", "to overwrite the main file in package.json")
	.option("--no-build","don't try to build",rc.build===false)
	.action(async function(dest=".", {url,dir,pluginName,main,build}){
		const project=tryRequireProject(path.resolve(path.resolve(cwd,dest),"package.json"))
		if(build){
			if(project.scripts && project.scripts.build){
				try{
					console.log('trying to build before publish')
					execSync("npm run build",{studio:"ignore"})
					console.log("plugin built")
				}catch(e){
					console.log(chalk.yellow("build error:"+e.message))
					console.log(chalk.blue("but we will continue publish"))
					return
				}
			}else{
				console.log(chalk.yellow("no build script"))
			}
		}

		project.main=main||path.resolve(dest, project.main||"./index.js")
		if(project.readme){
			project.readme=path.resolve(dest, project.readme)
		}

		return getCloud()
			.then(cloud=>cloud.publish(project, url, dir))
			.then(({plugin_update:{name,version}})=>console.log(`${chalk.blue(name)}[${chalk.blue(version)}] published`))
			.catch(e=>{
				console.debug(e)
				console.error(chalk.red(e.message))
			})
	})

program.command("dev [flag]")
	.description("set/unset isDeveloper, support true[default]|false")
	.action(async flag=>{
		return (await getCloud())
			.dev(flag=="false" ? false : true)
			.catch(e=>{
				console.debug(e)
				console.error(chalk.red(e.message))
			})
	})

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}
