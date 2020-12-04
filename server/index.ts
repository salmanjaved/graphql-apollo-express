import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {graphql} from 'graphql';
import { PORT, NODE_ENV } from './config/config';
import apolloServer from './initGraphQLServer';
import { httpsRedirect, wwwRedirect } from './lib/http-redirect';
import schema from './schema';


const app = express();

app.enable('trust proxy');
app.use(helmet());

// redirects should be ideally setup in reverse proxy like nignx
if (NODE_ENV === 'production') {
  app.use('/*', httpsRedirect());

  app.get('/*', wwwRedirect());

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }));
}

app.get('/', async (req, res) => {
  let input = JSON.stringify({ username:'salman', lastName: 'Test' });
  const graphQLImageServices = input.replace(/"([^(")"]+)":/g,"$1:");

  let QUERY = `mutation {
    createUsers(input: [${graphQLImageServices}]) {
      users {
          id
          firstName
          lastName
          phone
          email
          username
      }
    }
  }`;
  console.log('QUERY', req);
  await graphql(schema, QUERY).then((result) => {
    console.log(result.data.createUsers.users);
  });
  res.send('hello');
});

// GraphQL server setup
apolloServer.applyMiddleware({ app, path: '/graphql' });

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.info(`\n\nExpress listen at http://localhost:${PORT} \n`);
});
