module.exports = {
	presets: ['babel-preset-expo'],
	plugins: [
	  ['module:react-native-dotenv', {
		moduleName: '@env',
		path: '.env.local', // or just '.env' depending on your setup
		safe: false,
		allowUndefined: true,
	  }],
	],
  };
  