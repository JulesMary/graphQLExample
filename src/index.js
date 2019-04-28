
//imports

const {GraphQLServer, withFilter, PubSub} = require('graphql-yoga');

//consts

const NEW_USER_CREATED = 'NEW_USER_CREATED';

//data

const users = [
  {
    name: 'Albert Einstein',
    age: 140,
    alive: false,
  },
  {
    name: 'Bibi Blocksberg',
    age: 39,
    alive: true,
  },
];

//typeDefs

const typeDefs = `
  type Query {
    users: [User]!
    user(name: String): User
  }
  
  type Mutation{
   createUser(name: String!, age: Int!): User!
  }
  
  type Subscription {
    newUser: User!
  }
  
  type User {
    name: String!
    age: Int!
    alive: Boolean!
  }
`;

//resolvers

const resolvers = {
  Query: {
    users: () => users,
    user: (_, { name }) => users.find(user => user.name === name)
  },

  Mutation: {
    createUser: (_, {name, age}) => {
      const newUser = {
        name: name,
        age: age,
        alive: true
      };
      users.push(newUser);
      //publish to subscription, name of the payload must equal the name of subscription
      pubsub.publish(NEW_USER_CREATED, {newUser})
      return newUser;
    },
  },

  Subscription: {
    newUser: {
      subscribe: (root, args, {pubsub}) => {
        return pubsub.asyncIterator(NEW_USER_CREATED);
      }
    }
  }

};

const pubsub = new PubSub();
const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: {pubsub}
});

server.start(() => {
  console.log('successfully started graphQL server on http://localhost:4000')
});