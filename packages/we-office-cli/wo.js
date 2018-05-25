#!/usr/bin/env node
const program = require('commander')
const prompts=require("prompts")
const chalk=require("chalk")
const fs=require("fs")
const path=require("path")
const merge=require("lodash.merge")
const cwd=process.cwd()
const Cloud=require("./cloud")
const { execSync } = require('child_process')
const rc=require("rc")("wo",{service:"http://qili2.com/1/graphql"})
const tryRequire=a=>{
	try{
		return require(a)
	}catch(e){
		return {}
	}
}

const project=tryRequire(path.resolve(cwd,"package.json"))

program
	.version(require("./package.json").version, '-v, --version')
	.usage('[options] <command>')
	.description(require("./package.json").description)

program
	.command("init [dest]")
	.description("initialize this we-office plugin project, default dest=.")
	.option("-t, --type <type>","plugin type[loader|input|representation|emitter|stream]",/^(loader|input|representation|emitter|stream)$/i,"emitter")
	.action(function(dest=".", {type}){
		dest=path.resolve(cwd,dest)
		const copy=require("ncp").ncp

		function mergePackageJson(read, write, name){
			try{
				let that=tryRequire("./generator/template/package.json")
				let typed=tryRequire(`./generator/template/${type}/package.json`)
				let merged=merge({},that, typed, project)
				
				write.write(JSON.stringify(merged, null, 2))
				write.end()
			}catch(e){
				write.write(JSON.stringify(project, null, 2))
				write.end()
			}
		}

		copy(path.resolve(__dirname,"generator/template/"+type), dest, {
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
		})
	})

	
program
	.command("publish")
	.description("publish only package main file")
	.options("-u, --pluginsUrl <url>","only for test, such as http://localhost:9080")
	.options("-r, --pluginsDir <dir>","only for test, such as dist")
	.action(async function({url,dir}){
		if(project.scripts && project.scripts.build){
			try{	
				console.log('trying to build before publish')
				execSync("npm run build",{studio:"ignore"})
			}catch(e){
				console.log(chalk.yellow("build error:"+e.message))
				console.log(chalk.blue("but we will continue publish"))
				return 
			}
		}
		console.log(chalk.yellow("no build script"))
		
		return new Cloud(program.service, "5b07b8571f6cab002e832d23")
			.getToken(rc)
			.publish(project, url, dir)
			.then(()=>console.log(`published ${project.version}`))
			.catch(e=>console.log(e.message))
	})
	
program.parse(process.argv);
