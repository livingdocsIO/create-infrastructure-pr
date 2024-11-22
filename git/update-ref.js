const request = require('request-promise')

module.exports = async ({owner, repo, token, ref, sha}) => {
  try {
    const options = {
      method: 'PATCH',
      uri: `https://api.github.com/repos/${owner}/${repo}/git/refs/${ref}`,
      headers: {
        'User-Agent': 'Request-Promise',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      body: {
        sha: sha,
        force: true
      },
      json: true
    }
    return request(options)
  } catch (error) {
    throw error
  }
}
