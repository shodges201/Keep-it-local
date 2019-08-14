# <img src="../Project-2/public/images/header2.gif">

"Keep It Local" is a private network used to build

#
## Features

* Anonymously post and promote local events
* RSVP to and leave messages on events
* Refer who you want
#
## Use by Referal

In order to be able to be apart of the Keep It Local network, you must first be invited by a current users's Referal Code. Once you have created your own profile, you will be given your own Referal Code that will change every 3 days.

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

* [Bootstarp](https://getbootstrap.com/) - Web Framework
* [Materialize](https://materializecss.com/) - Web Framework
* [Handlebars](https://handlebarsjs.com/) - Templating
#
## Team Members
* Zubin Mulji
* Lance Toledo
* Scott Hodges
* Quinton Smith
#
## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

