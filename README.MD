# <img src="../Project-2/public/images/header2.gif">

"Keep It Local" is a private network used to build

#
## Use by Referal

In order to be able to use the Keep It Local Network, you must first be invited by a current users's Referal Code. Once you have created your own profile, you will be given your own Referal Code that will change every 3 days.

```
db.ReferralCodes.create({
      creatorID: req.user.userName,
      // Generates an array of 5 random strings with 8 characters in length and selecting the first one.
      code: voucher_codes.generate({
        length: 8,
        count: 5
      })[0]
    })
```
#

#
## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details