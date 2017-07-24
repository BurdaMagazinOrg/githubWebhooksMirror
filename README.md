# githubWebhooksMirror

## How to install
- Obtain a publicly accessible server
- Add its public key to your github account
- Make sure, that this server is authenticated to the server, where the github repo should be mirrored to
- Upload the code from this repository
- Make a new oauth app on github: https://github.com/settings/developers
  - as "Authorization callback URL" type http[s]://[your ip or domain]:[port where app will be running]/admin/auth/callback
- Copy `example.settings.json` to `settings.json` and configure it with the data of your new app
- start it up with `node server.js` or with [pm2](https://github.com/Unitech/pm2) (recommended)

## How to use
- Go to `/admin`
- If it is the first time starting up, you have to create a user for basic auth
- Afterwards you can click on `Login with GitHub` to log in. This will fetch all your repositories
- Select the repository, you want to mirror and type the URL, where it should go (for Drupal e.g.: username@git.drupal.org:project/your_project.git)
- Type in the branches, which should be mirrored, seperated by space
- By clicking Add, the mirror will be configured, the webhook will be created for the selected repo and the initial mirror will be triggered
- If you don't want to mirror a repo anymore, just click on the X in the top left of it. This will also remove the webhook
