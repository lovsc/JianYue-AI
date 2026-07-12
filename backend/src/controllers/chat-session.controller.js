const sessions = require('../services/chat-session.service')
const chatService = require('../services/chat.service')
const chats = require('../repositories/chat.repository')
const resumeService = require('../services/resume.service')
const { AppError } = require('../utils/app-error')
const { success } = require('../utils/response')

const list=(req,res)=>success(res,{sessions:sessions.list(req.user.id)},'获取对话列表成功')
const get=(req,res)=>success(res,sessions.get(Number(req.params.id),req.user.id),'获取对话成功')
const create=(req,res)=>success(res,{session:sessions.create(req.body||{},req.user.id)},'对话创建成功',201)
const remove=(req,res)=>{sessions.remove(Number(req.params.id),req.user.id);success(res,null,'对话已删除')}

async function send(req,res){
  const id=Number(req.params.id)
  const {session}=sessions.get(id,req.user.id)
  const content=String(req.body?.content||'').trim()
  if(!content||content.length>10000)throw new AppError(400,'消息长度应为 1 到 10000 个字符','VALIDATION_ERROR')
  chats.addMessage(id,'user',content)
  const history=chats.listMessages(id,30).map(({role,content:text})=>({role,content:text}))
  const messages=[]
  if(session.resume_id){const resume=resumeService.get(session.resume_id,req.user.id);messages.push({role:'system',content:`你是求职与简历顾问。以下是用户主动选择的简历上下文。回答时只能基于真实内容，不得虚构经历：${JSON.stringify(resume.content)}`})}
  messages.push(...history)
  if(session.title==='新对话')chats.updateTitle(id,req.user.id,content.slice(0,28))
  res.setHeader('Content-Type','text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control','no-cache, no-transform')
  res.setHeader('Connection','keep-alive')
  res.setHeader('X-Accel-Buffering','no')
  res.socket?.setNoDelay(true)
  res.flushHeaders()
  res.write(': connected\n\n')

  const heartbeat=setInterval(()=>{if(!res.writableEnded)res.write(': heartbeat\n\n')},10000)
  let response
  try{
    response=await chatService.createChatStream(messages)
  }catch(error){
    clearInterval(heartbeat)
    console.error('Chat upstream failed:',error.response?.status||error.message)
    res.write(`data: ${JSON.stringify({error:'AI 服务响应失败，请稍后重试'})}\n\n`)
    return res.end()
  }

  let assistant='',buffer='',finished=false
  const finish=()=>{if(finished)return;finished=true;clearInterval(heartbeat);if(assistant.trim())chats.addMessage(id,'assistant',assistant);if(!res.writableEnded)res.end()}
  response.data.on('data',chunk=>{
    const text=chunk.toString()
    if(!res.writableEnded)res.write(text)
    buffer+=text
    const lines=buffer.split('\n');buffer=lines.pop()||''
    for(const line of lines){if(!line.trim().startsWith('data:'))continue;const json=line.replace(/^data:\s*/,'').trim();if(json==='[DONE]')continue;try{assistant+=JSON.parse(json).choices?.[0]?.delta?.content||''}catch{}}
  })
  response.data.on('end',finish)
  response.data.on('error',finish)
  res.on('close',()=>{clearInterval(heartbeat);if(!finished&&!response.data.destroyed)response.data.destroy()})
}

module.exports={list,get,create,remove,send}
