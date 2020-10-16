let db = {
  users: [
    {
      userId: "kAvfJ6M7tff0Zb7DQsa15e2Em1i1",
      email: "user@email.com",
      handle: "user",
      createdAt: "2020-09-09T05:54:44.851Z",
      imageUrl: "image/szdfsdifjsf",
      bio: "Hello, my name is user",
      website: "https://user.com",
      location: "Vancouver, BC",
    },
  ],
  shouts: [
    {
      userHandle: "user",
      body: "This is the shout body",
      createdAt: "2020-09-09T03:57:12.615Z",
      likeCount: 5,
      commentCount: 2,
    },
  ],
  comments: [
    {
      userHandle: "user",
      shoutId: "vOdYcSGRPL2lhIAinIzT",
      body: "Hello",
      createdAt: "2020-10-15T10:59:52.798Z",
    },
  ],
  notifications: [
    {
      recipient: "user",
      sender: "john",
      read: "true | false",
      shoutId: "sjeifjosiejfdrgrgsefgsef",
      type: "like | comment",
      createdAt: "2020-09-27T19:03:02.413Z",
    },
  ],
};

const userDetails = {
  // Redux data
  credentials: {
    userId: "lZa6IZNqxbQKyOj5aoClTOmb0yN2",
    email: "user6@gmail.com",
    handle: "user6",
    createdAt: "2020-09-13T09:00:42.133Z",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/socialmedia-fbd1a.appspot.com/o/5568.jpg?alt=media",
    bio: "Hello world",
    website: "https://google.com",
    location: "Los Angeles, Ca",
  },
  likes: [
    {
      userHandle: "user",
      shoutId: "xxclceQk0dF75pet7Oui",
    },
    {
      userHandle: "user",
      shoutId: "ZOx0m4no0uYqpqQam0qn",
    },
  ],
};
