const request = require('request-promise')

module.exports = async ({owner, repo, token, content}) => {
  const options = {
    method: 'POST',
    uri: `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
    headers: {
      'User-Agent': 'Request-Promise',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json'
    },
    body: {
      content: content,
      encoding: 'base64'
    },
    json: true
  }
  return request(options)
}
