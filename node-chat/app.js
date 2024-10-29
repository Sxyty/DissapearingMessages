const axios = require('axios');
const prompt = require('prompt');
const ora = require('ora');
const { StreamChat } = require('stream-chat');
const util = require('util');
const blessed = require('neo-blessed');

function fetchToken(username) {
  return axios.post('http://localhost:5500/join', { username });
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
    spinner.succeed('Token fetched successfully!');
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

    process.stdin.removeAllListeners('data');
    const screen = blessed.screen({
      smartCSR: true,
      title: 'Stream Chat Demo',
    });

    var messageList = blessed.list({
      align: 'left',
      mouse: true,
      keys: true,
      width: '100%',
      height: '90%',
      top: 0,
      left: 0,
      scrollbar: {
        ch: ' ',
        inverse: true,
      },
      items: [],
    });

    var input = blessed.textarea({
      bottom: 0,
      height: '10%',
      inputOnFocus: true,
      padding: {
        top: 1,
        left: 2,
      },
      style: {
        fg: '#787878',
        bg: '#454545',
        focus: {
          fg: '#f6f6f6',
          bg: '#353535',
        },
      },
    });

    input.key('enter', async function () {
      var message = this.getValue().trim();
      let timeout = 5000; // Default timeout

      // Check if the message contains a timeout command
      if (message.startsWith('/timeout=')) {
        const parts = message.split(' ');
        timeout = parseInt(parts[0].split('=')[1], 10);
        message = parts.slice(1).join(' ');
      }

      try {
        await channel.sendMessage({ text: message, timeout });
      } catch (err) {
        // error handling
      } finally {
        this.clearValue();
        screen.render();
      }
    });

    screen.key(['escape', 'q', 'C-c'], function () {
      return process.exit(0);
    });

    screen.append(messageList);
    screen.append(input);
    input.focus();
    screen.render();

    channel.on('message.new', async event => {
      const { text, timeout = 5000 } = event.message;
      const messageText = `${event.user.id}: ${text}`;
      const messageIndex = messageList.addItem(messageText);
      messageList.scrollTo(100);
      screen.render();

      // Set a timeout to remove the message after the specified duration
      setTimeout(() => {
        messageList.removeItem(messageIndex);
        screen.render();
      }, timeout);
    });
  } catch (err) {
    spinner.fail();
    console.log(err);
    process.exit(1);
  }
}

main();
