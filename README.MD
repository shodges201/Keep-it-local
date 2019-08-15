# <img src="../Project-2/public/images/header2.gif"> KEEP IT LOCAL

"Keep It Local" is a private network used to browse and post local events anonymously.

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

* [Materialize](https://materializecss.com/) - Web Framework
* [Handlebars](https://handlebarsjs.com/) - Templating
* [Moment](https://momentjs.com/docs/) - Library for parsing, manipulating time values
* [Passport](http://www.passportjs.org/) - Login Authentication for Node.js
* [Geocoder](https://developer.mapquest.com/documentation/geocoding-api/) - Library for geocoding via MapQuest API

#
## Team Members
* Zubin Mulji
* Lance Toledo
* Scott Hodges
* Quinton Smith
#
## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

