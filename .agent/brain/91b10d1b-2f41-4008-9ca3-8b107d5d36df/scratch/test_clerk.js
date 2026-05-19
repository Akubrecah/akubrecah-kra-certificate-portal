const { createClerkClient } = require('@clerk/backend');
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
async function run() {
  try {
    const users = await clerkClient.users.getUserList({limit: 1});
    console.log(users.data[0].createdAt);
  } catch (e) {
    console.error(e);
  }
}
run();
