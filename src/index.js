
//imports

const {GraphQLServer, withFilter, PubSub} = require('graphql-yoga');

//consts

const NEW_USER_CREATED = 'NEW_USER_CREATED';
const ITEM_BOUGHT = 'ITEM_BOUGHT';

//data

const users = [
  {
    name: 'Albert Einstein',
    age: 140,
    budget: 5000,
    items: [],
  },
  {
    name: 'Bibi Blocksberg',
    age: 39,
    budget: 30,
    items: [],
  },
];

const items = [
  {
    title: 'Book',
    price: 10,
  },
  {
    title: 'Coffee',
    price: 1.50,
  }
];

//typeDefs

const typeDefs = `
  type Query {
    users: [User]!
    user(name: String): User
  }
  
  type Mutation{
   createUser(name: String!, age: Int!): User!
   buy(userName: String!, itemName: String!): User!
  }
  
  type Subscription {
    newUser: User!
    itemBought: String!
  }
  
  type User {
    name: String!
    age: Int!
    budget: Float!
    items: [Item]!
  }
  
  type Item {
    title: String!
    price: Float! 
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
        budget: 100,
        items: [],
      };
      users.push(newUser);
      //publish to subscription, name of the payload must equal the name of subscription
      pubsub.publish(NEW_USER_CREATED, {newUser})
      return newUser;
    },
    buy: (_, {userName, itemName}) => {
      const item = items.find(item => item.title === itemName);
      const user = users.find(user => user.name === userName);
      user.items.push(item);
      user.budget -= item.price;
      const itemBought = `${user.name} bought a ${item.title} and has ${user.budget} left`;
      pubsub.publish(ITEM_BOUGHT, {itemBought});
      return user;
    }
  },

  Subscription: {
    newUser: {
      subscribe: (root, args, {pubsub}) => {
        return pubsub.asyncIterator(NEW_USER_CREATED);
      }
    },
    itemBought: {
      subscribe: (root, args, {pubsub}) => {
        return pubsub.asyncIterator(ITEM_BOUGHT);
      }
    }
  }

};

//server
const pubsub = new PubSub();
const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: {pubsub}
});

server.start(() => {
  console.log('successfully started graphQL server on http://localhost:4000')
});