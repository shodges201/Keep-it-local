# <img src="../Project-2/public/images/header2.gif">

"Keep It Local" is a private network used to build

#
## Use by Referal

In order to be able to use the Keep It Local Network, you must first be invited by a current users's Referal Code. Once you have created your own profile, you will be given your own Referal Code that will change every 3 days.

```js
app.post("/api/code", function (req, res) {
    db.ReferralCodes.create({
      creatorID: req.user.userName,
      code: voucher_codes.generate({
        length: 8,
        count: 5
      })[0]
    }).then(function (resp) {
      console.log("code created");
      console.log(resp);
      res.json(resp);
    })
  })
```
#
## Built With

[Bootstarp](https://getbootstrap.com/) - Web Framework
[Materialize](https://materializecss.com/) - Web Framework
[Handlebars](https://handlebarsjs.com/) - Templating
#
## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
#
## Team Members
Zubin Mulji
Scott Hodges
Lance Toledo
Quinton Smith