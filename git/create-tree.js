const request = require('request-promise')

module.exports = async ({owner, repo, token, baseTree, tree}) => {
  try {
    const options = {
      method: 'POST',
      uri: `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      headers: {
        'User-Agent': 'Request-Promise',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json'
      },
      body: {
        base_tree: baseTree,
        tree: tree
      },
      json: true
    }
    return request(options)
  } catch (error) {
    throw error
  }
}
