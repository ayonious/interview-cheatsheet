---
id: jWT
title: Json Web Token
sidebar_label: jWT
---

### What?

Its a way of securely transfer data between 2 parties.

### How?

1. During sign in user gets a token that is signed by a secret key from Server.
2. This token is passed from client each time. Server decrypts this token using his key to verify who this user is. This token cant be changed by anyone without knowing server secret key

### Why?

1. No need to have extra database on server to know each user sessions. In normal session based authorization server needs to store session to know which user this session belongs to. But here we know the users based on decrypting the token using the Secret-Key.

2. If there are 2 external services that needs to authorize user that has the same token just sharing the Secret-Key between services is enough to validate user. In session based system user needed to be re logged in in each service or the database needed to be shared between services.

### Some tricky questions?

1. How do logout work in jwt?

- cookie deletion response from server. This

2. How to force a user to logout on all sessions?

- We need to keep a blacklist server with each user id. This way we can keep track which user needs to be logged out.
- Or we can keep the token lifetime short and rotate them all the time.
- One good way to immediately block the user from all sessions in case of token compromise is to Change the userid to something so that the user wont be found anymore.

### Common hacking Attempt in jwt?

1. First is the none algorithm technique. If you send token from client with algorithm as none this makes all verifications invalid and you get access

2. Misuse of RS2556 HS256.

RS2556 => private key to encrypt token => public key to decrypt
HS256 => same key to encrypt/decrypt token

Now if from client we change the algorithm to HS256 and then encrypt the message using this then server will theoretically think all is going okay
