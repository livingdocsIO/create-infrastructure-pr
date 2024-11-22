const request = require('request-promise')

module.exports = async ({owner, repo, token, message, tree, parents}) => {
  try {
    const options = {
      method: 'POST',
      uri: `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      headers: {
        'User-Agent': 'Request-Promise',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      body: {
        message: message,
        tree: tree,
        parents: parents
      },
      json: true
    }
    return request(options)
  } catch (error) {
    throw error
  }
}
