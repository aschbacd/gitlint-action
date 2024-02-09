# GitLint Action

This GitHub Action ensures that your naming conventions for commits, branches, and pull requests
are being respected. GitLint uses min. and max. character counts as well as regular expressions
to check against the data. It is recommended to add a workflow that runs when a pull request is
created or when it gets updated.

## Usage

Create the file `.github/workflows/linters.yaml` in your repository and add the following workflow:

```yaml
name: Linters
```
on:
  pull_request: {}
  push: {}

jobs:
  gitlint:
    runs-on: ubuntu-latest
    name: GitLint
    steps:
      - name: Lint commits, branches, and pull requests
        uses: aschbacd/gitlint-action@v1.1.1
```

### Example configuration for Jira

If you want to allow Jira issue ids at the beginning of the commit message / pull request title you
can use the following configuration. With this configuration commit messages / pull request titles
like `[GLA-1] Add sample file` as well as `Add sample file` will be valid.

```yaml
name: Linters

on:
  pull_request: {}
  push: {}

jobs:
  gitlint:
    runs-on: ubuntu-latest
    name: GitLint
    steps:
      - name: Lint commits, branches, and pull requests
        uses: aschbacd/gitlint-action@v1.1.1
        with:
          re-commit-message-subject: ^(\[[A-Z]+\-[0-9]+\] )?[A-Z].*((?!\.).)$
          re-pull-request-title: ^(\[[A-Z]+\-[0-9]+\] )?[A-Z].*((?!\.).)$
```

## Customization

The following input keys can be used in your GitHub Actions workflow (shown above).

| Key                                | Description                                                  | Default                 |
| ---------------------------------- | ------------------------------------------------------------ | ----------------------- |
| commit-message-body-max-length     | Max. characters for line in commit message body              | 72                      |
| commit-message-body-min-length     | Min. characters for line in commit message body              | -1 (disabled)           |
| commit-message-subject-max-length  | Max. characters for commit message subject                   | 50                      |
| commit-message-subject-min-length  | Min. characters for commit message subject                   | -1 (disabled)           |
| github-token                       | Token used to authenticate against GitHub api                | `${{ github.token }}`   |
| prohibit-blank-lines-cm-body       | Commit message body cannot include blank lines               | `false`                 |
| prohibit-unknown-commit-authors    | Commit author must be GitHub user                            | `true`                  |
| prohibit-unknown-commit-committers | Commit committer must be GitHub user                         | `true`                  |
| prohibit-unsigned-commits          | Commits without a valid signature are invalid                | `false`                 |
| re-branch-name                     | Regex used to check branch name                              | `.*`                    |
| re-commit-author-email             | Regex used to check commit author email                      | `.*`                    |
| re-commit-author-name              | Regex used to check commit author name                       | `.*`                    |
| re-commit-committer-email          | Regex used to check commit committer email                   | `.*`                    |
| re-commit-committer-name           | Regex used to check commit committer name                    | `.*`                    |
| re-commit-message-body             | Regex used to check commit message body (DotAll)             | `.*`                    |
| re-commit-message-split            | Regex used to split commit message subject and body (DotAll) | `([^\n]*)(?:\n\n(.*))?` |
| re-commit-message-subject          | Regex used to check commit message subject                   | `^[A-Z].*((?!\\.).)$`   |
| re-pull-request-title              | Regex used to check pull request title                       | `^[A-Z].*((?!\\.).)$`   |
| re-tag-name                        | Regex used to check tag name                                 | `.*`                    |

## Resources

If you want to learn more about Git commits check out [this section](https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History)
of the Pro Git book.
