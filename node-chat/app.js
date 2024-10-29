// app.js
const axios = require('axios');
const prompt = require('prompt');
const ora = require('ora');
const { StreamChat } = require('stream-chat');
const util = require('util');
const blessed = require('neo-blessed');

function fetchToken(username) {
  return axios.post('http://localhost:5500/join', {
    username,
  });
}

async function main() {
  const spinner = ora();
  prompt.start();
  prompt.message = '';

  const get = util.promisify(prompt.get);

  const usernameSchema = [
    {
      description: 'Enter your username',
      name: 'username',
      type: 'string',
      pattern: /^[a-zA-Z0-9\-]+$/,
      message: 'Username must be only letters, numbers, or dashes',
      required: true,
    },
  ];

  const { username } = await get(usernameSchema);
  try {
    spinner.start('Fetching authentication token...');
    const response = await fetchToken(username);
    spinner.succeed(`Token fetched successfully!`);

    const { token } = response.data;
    const apiKey = response.data.api_key;

    const chatClient = new StreamChat(apiKey);

    spinner.start('Authenticating user...');
    await chatClient.setUser(
      {
        id: username,
        name: username,
      },
      token
    );
    spinner.succeed(`Authenticated successfully as ${username}!`);

    spinner.start('Connecting to the General channel...');
    const channel = chatClient.channel('team', 'general');
    await channel.watch();
    spinner.succeed('Connection successful!');
  } catch (err) {
    spinner.fail();
    console.log(err);
    process.exit(1);
  }
}
main();