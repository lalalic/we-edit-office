import React, {Fragment,Component} from "react"
import PropTypes from "prop-types"
import {connect} from "react-redux"

import PullToRefresh from "pull-to-refresh2"
import {compose, mapProps} from "recompose"
import {withFragment} from "qili-app"
import {TextField, List, ListItem} from "material-ui"

import QuickSearch,{toText} from "./quick-search"

class Plugins extends Component{
	state={title:"",conditionAnchor:undefined}
	render(){
		const {plugins, refresh, loadMore, qs, search}=this.props
		const {title,conditionAnchor}=this.state
		return (
			<Fragment>
				<TextField
						hintText={`${toText(qs)}`||"search"}
						name="search"
						value={title||""}
						onChange={(e,title)=>this.setState({title})}
						onKeyDown={e=>e.keyCode==13 && search({search:title})}
						onFocus={e=>this.setState({conditionAnchor:e.target})}
						fullWidth={true}/>
						
				<QuickSearch
					qs={qs}
					style={{opacity:0.9}}
					open={!!conditionAnchor}
					anchorEl={conditionAnchor}
					anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
					targetOrigin={{horizontal: 'left', vertical: 'top'}}
					search={condition=>{
						this.setState({conditionAnchor:undefined})
						search(condition)
					}}
					/>
					
				<PullToRefresh onRefresh={refresh} onMore={loadMore}>
					<List>
					{plugins.map(({id,name,desc,ver, author:{username}})=>(
							<ListItem key={id}
								primaryText={name}
								secondaryTextLines={2}
								secondaryText={`[ver:${ver}] ${desc}--${username}`}
								
								/>
						))}
					</List>
				</PullToRefresh>
			</Fragment>
		)
	}
}

export default compose(
	withFragment(graphql`fragment list_plugins on Query{
		plugins(type:$type, mine:$mine, favorite:$favorite, 
			search:$search, first:$count, after:$cursor)@connection(key:"list_plugins"){
			edges{
				node{
					id
					name
					desc
					ver
					author{
						username
					}
				}
			}
			pageInfo{
				hasNextPage
				endCursor
			}
		}
	}`),
	mapProps(({plugins:{plugins:{edges}}, relay,search,qs})=>(
		{
			plugins:edges.map(a=>a.node),
			refresh(ok){
				ok()
			},
			loadMore(ok){
				if(relay.hasMore() && !relay.isLoading()){
					relay.loadMore(10, e=>{
						ok()
						if(e){
							console.error(e)
						}
					})
				}else
					ok()
			},
			search,qs
		}
	))
)(Plugins)