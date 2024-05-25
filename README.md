# node-express-banksajt-solution

1. Starta MAMP och gå in i myPHPadmin
2. CDa till mappen Frontend och kör:
   ```
   npm run dev
   ```
3. CDa till mappen Backend och kör:
   ```
   npm start
   ```
4. Gå till browsern och skapa en user, logga in usern, gör en deposit.
5. Testa även med Thunder Client genom att putta in olika object i body, tex dessa

```
POST localhost:3000/users
```

med detta i body

```
{
"username": "binggo",
"password": "bonggo"
}
```

eller denna:

```
POST localhost:3000/sessions
```

med detta i body

```
{
"username": "binggo",
"password": "bonggo"
}
```

Testa även i browsern.
