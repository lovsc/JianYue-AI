const { db } = require('../database')
const { success } = require('../utils/response')

function get(req,res){
  const userId=req.user.id
  const stats=db.prepare(`SELECT
    (SELECT COUNT(*) FROM resumes WHERE user_id=@userId) AS resumes,
    (SELECT COUNT(*) FROM resumes WHERE user_id=@userId AND status='completed') AS completed_resumes,
    (SELECT COUNT(*) FROM resume_analyses WHERE user_id=@userId) AS analyses,
    (SELECT COUNT(*) FROM chat_sessions WHERE user_id=@userId) AS chat_sessions,
    (SELECT COUNT(*) FROM export_records WHERE user_id=@userId) AS exports
  `).get({userId})
  const recentAnalyses=db.prepare(`SELECT a.id,a.created_at,json_extract(a.result_json,'$.score') AS score,j.position,j.company FROM resume_analyses a JOIN job_descriptions j ON j.id=a.job_description_id WHERE a.user_id=? ORDER BY a.created_at DESC LIMIT 4`).all(userId)
  success(res,{stats,recentAnalyses},'获取工作台数据成功')
}

module.exports={get}
