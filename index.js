const core = require('@actions/core')
const github = require('@actions/github')

async function run() {
  try {

    // -----
    // --------------- GET DATA
    // ----------

    // Get octokit
    const githubToken = core.getInput('github-token')
    const octokit = github.getOctokit(githubToken)

    // Get data
    const { data: pullRequest } = await octokit.pulls.get({
      owner: github.context.payload.repository.owner.login,
      repo: github.context.payload.repository.name,
      pull_number: github.context.payload.pull_request.number
    })
    const { data: commits } = await octokit.pulls.listCommits({
      owner: github.context.payload.repository.owner.login,
      repo: github.context.payload.repository.name,
      pull_number: github.context.payload.pull_request.number
    })

    // -----
    // --------------- GET INPUT
    // ----------

    const commitMessageBodyMaxLength = parseInt(core.getInput('commit-message-body-max-length'))
    const commitMessageBodyMinLength = parseInt(core.getInput('commit-message-body-min-length'))
    const commitMessageSubjectMaxLength = parseInt(core.getInput('commit-message-subject-max-length'))
    const commitMessageSubjectMinLength = parseInt(core.getInput('commit-message-subject-min-length'))

    const prohibitUnknownCommitAuthors = (core.getInput('prohibit-unknown-commit-authors') == 'true')
    const prohibitUnknownCommitCommitters = (core.getInput('prohibit-unknown-commit-committers') == 'true')
    const prohibitUnsignedCommits = (core.getInput('prohibit-unsigned-commits') == 'true')

    const regexBranchName = RegExp(core.getInput('re-branch-name'))
    const regexCommitAuthorEmail = RegExp(core.getInput('re-commit-author-email'))
    const regexCommitAuthorName = RegExp(core.getInput('re-commit-author-name'))
    const regexCommitCommitterEmail = RegExp(core.getInput('re-commit-committer-email'))
    const regexCommitCommitterName = RegExp(core.getInput('re-commit-committer-name'))
    const regexCommitMessageBody = RegExp(core.getInput('re-commit-message-body'), 's')
    const regexCommitMessageSplit = RegExp(core.getInput('re-commit-message-split'), 's')
    const regexCommitMessageSubject = RegExp(core.getInput('re-commit-message-subject'))
    const regexPullRequestTitle = RegExp(core.getInput('re-pull-request-title'))

    // -----
    // --------------- CHECK DATA
    // ----------

    core.info(`Pull request title: ${pullRequest.title}`)
    core.info(`Branch name: ${pullRequest.head.ref}`)

    // Check pull request title
    if (!regexPullRequestTitle.test(pullRequest.title))
      core.setFailed("Pull Request title does not match regex")

    // Check branch name
    if (!regexBranchName.test(pullRequest.head.ref))
      core.setFailed("Branch name does not match regex")
    
    // Check all commits
    commits.forEach(commit => {
      // Split commit message
      let matches = regexCommitMessageSplit.exec(commit.commit.message)
      let commitMessageSubject = matches[1]
      let commitMessageBody = matches[2]

      console.log('-----')
      core.info(`Commit hash: ${commit.sha}`)
      core.info(`Commit author email: ${commit.commit.author.email}`)
      core.info(`Commit author name: ${commit.commit.author.name}`)
      core.info(`Commit author GitHub account: ${commit.author}`)
      core.info(`Commit committer email: ${commit.commit.committer.email}`)
      core.info(`Commit committer name: ${commit.commit.committer.name}`)
      core.info(`Commit committer GitHub account: ${commit.committer}`)
      core.info(`Commit has valid signature: ${commit.commit.verification.verified}`)
      core.info(`Commit message subject: ${commitMessageSubject}`)
      core.info(`Commit message body: ${commitMessageBody}`)

      // Check commit author
      if (prohibitUnknownCommitAuthors && commit.author == null)
        core.setFailed(`Commit author does not exist on GitHub (${commit.sha.substr(0, 7)})`)

      if (!regexCommitAuthorEmail.test(commit.commit.author.email))
        core.setFailed(`Commit author email does not match regex (${commit.sha.substr(0, 7)})`)

      if (!regexCommitAuthorName.test(commit.commit.author.name))
        core.setFailed(`Commit author name does not match regex (${commit.sha.substr(0, 7)})`)

      // Check commit committer
      if (prohibitUnknownCommitCommitters && commit.committer == null)
        core.setFailed(`Commit committer does not exist on GitHub (${commit.sha.substr(0, 7)})`)

      if (!regexCommitCommitterEmail.test(commit.commit.committer.email))
        core.setFailed(`Commit committer email does not match regex (${commit.sha.substr(0, 7)})`)

      if (!regexCommitCommitterName.test(commit.commit.committer.name))
        core.setFailed(`Commit committer name does not match regex (${commit.sha.substr(0, 7)})`)
      
      // Check for valid signature
      if (prohibitUnsignedCommits && !commit.commit.verification.verified)
        core.setFailed(`Commit has no valid signature (${commit.sha.substr(0, 7)})`)

      // Check commit message subject
      if (commitMessageSubjectMinLength != -1 && commitMessageSubject.length < commitMessageSubjectMinLength)
        core.setFailed(`Commit message subject is too short (${commit.sha.substr(0, 7)})`)

      if (commitMessageSubjectMaxLength != -1 && commitMessageSubject.length > commitMessageSubjectMaxLength)
        core.setFailed(`Commit message subject is too long (${commit.sha.substr(0, 7)})`)

      if (!regexCommitMessageSubject.test(commitMessageSubject))
        core.setFailed(`Commit message subject does not match regex (${commit.sha.substr(0, 7)})`)

      // Check commit message body
      if (commitMessageBody != null) {
        commitMessageBody.split("\n").forEach(function (line, index) {
          if (commitMessageBodyMinLength != -1 && line.length < commitMessageBodyMinLength)
            core.setFailed(`Commit message body line ${(index+1).toString()} is too short (${commit.sha.substr(0, 7)})`)

          if (commitMessageBodyMaxLength != -1 && line.length > commitMessageBodyMaxLength)
            core.setFailed(`Commit message body line ${(index+1).toString()} is too long (${commit.sha.substr(0, 7)})`)
        })

        if (!regexCommitMessageBody.test(commitMessageBody))
          core.setFailed(`Commit message body does not match regex (${commit.sha.substr(0, 7)})`)
      }
    })
  } catch (error) {
    core.setFailed(error.message);
  }
}

run()
