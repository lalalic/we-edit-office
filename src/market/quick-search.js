import React from "react"
import PropTypes from "prop-types"
import {compose, getContext, withProps, withStateHandlers} from "recompose"

import {Popover, Chip, Subheader} from "material-ui"
import {blue300 as SELECTED, indigo900} from 'material-ui/styles/colors'

const TYPES=["Input","Loader","Emitter","Output","Ribbon", "Representation"]
const CONDS=[
	{label:"自己写的",key:"mine"},
	{label:"收藏的",key:"favorite"},
]
const style={
	 chip: {
		margin: 4,
	  },
	  wrapper: {
		display: 'flex',
		flexWrap: 'wrap',
		margin: 10
	  }
}
export const QuickSearch=({
	mine,favorite,ph={mine,favorite},
	type=[],toggle, toggleType, search,
	...others})=>(
	<Popover {...others} onRequestClose={()=>{
			search({mine,favorite,type})
		}}>
		<div>
			<Subheader>Common Used</Subheader>
			<div style={style.wrapper}>
				{
					CONDS.map(({label,key})=>(
						<Chip key={label}
							style={style.chip}
							backgroundColor={ph[key] ? SELECTED: undefined}
							onClick={()=>toggle(key)}>{label}</Chip>
					))
				}
			</div>
		</div>
		<div>
			<Subheader>Plugin Type</Subheader>
			<div style={style.wrapper}>
				{TYPES.map(a=>(
					<Chip key={a}
						backgroundColor={type.includes(a)? SELECTED : undefined}
						style={style.chip}
						onClick={()=>toggleType(a)}>
						{a}
					</Chip>
				))}
			</div>
		</div>
	</Popover>
)

export const toText=({type,search,...qs})=>{
	let conds=[...type]
	CONDS.forEach(({key,label})=>qs[key] && conds.push(label))
	if(search)
		conds.push(`desc=*${search}*`)
	return conds.join(",")
}

export default compose(
	withStateHandlers(
		({qs:{mine,favorite,type}})=>({mine,favorite,type}),
		{
			toggle:(state,{})=>key=>{
				let prev=!!state[key]
				return {[key]:!prev}
			},
			toggleType: ({type})=>a=>{
				let i=type.indexOf(a)
				if(i==-1){
					return {type:[...type,a]}
				}else{
					let changing=[...type]
					changing.splice(i,1)
					return {type:changing}
				}
			},
		}
	),
)(QuickSearch)
