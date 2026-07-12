const chats = require('../repositories/chat.repository')
const resumeService = require('./resume.service')
const { AppError } = require('../utils/app-error')

const get = (id,userId) => { const session=chats.findSession(id,userId);if(!session)throw new AppError(404,'对话不存在','CHAT_NOT_FOUND');return{session,messages:chats.listMessages(id)} }
const list = userId => chats.listSessions(userId)
function create(input,userId){let resumeId=null;if(input.resumeId){resumeId=Number(input.resumeId);resumeService.get(resumeId,userId)}const title=String(input.title||'新对话').trim().slice(0,50)||'新对话';return chats.createSession(userId,resumeId,title)}
function remove(id,userId){if(!chats.deleteSession(id,userId))throw new AppError(404,'对话不存在','CHAT_NOT_FOUND')}

module.exports={get,list,create,remove}
