---
layout: post
title:  "Setting Up NIP-57 for Dummies (me)"
date: '2023-02-28'
categories: lightning bitcoin nostr nip-57
---

# What is NIP-57

[`NIP-57`][NIP-57] defines two new note types of kind `9734` and `9735` (9735 is the default port for a lightning node). `9734` is the zap request which is a Nostr note that you send with a lightning payment. `9735` is the zap note which the person who got Zapped (tipped) sends to relays in order to display the zap in a Nostr client. 

The [NIP][NIP-57] itself defines all this but to simplify it a little bit, NIP-57 allows your Zap (a lightning tip) to show up in a Nostr client. You can see an example here from [Damus]:

![image](/images/damus-zap.jpeg)

Lightning tips have been available on [Damus] and other clients as well for a while now. But, Zaps actually show up in your notifications and on the post itself on many clients.

![image](/images/damus-zap-on-thread.jpeg)

In order for the Nostr client to display these it needs to receive a note, signed by you. That's the Zap Note of kind `9735`.

But, how can you send a note from someone else who zapped you? That's what the Zap Request note of kind `9734` is for.

# Embedding a Nostr Note in a Lightning Invoice

On most Nostr clients you can add a [Lightning Address] to your profile, mine is [joel@klabo.blog] for example. Adding this to your profile is what enables the Lightning Tip button you have probably seen before on multiple clients:

![image](/images/lightning-tip-button.jpeg)

This button uses the [Lightning Address] to open your Lightning wallet and make a payment. But, these payments don't show up on Nostr because there is nothing tying them to you or the person who tipped you.

> If you're not familiar with the regular [Lightning Address] flow, check out this post I wrote on setting that up with Core Lightning: 
>
> [Setting up Lightning Addresss with Core Lightning]

The way Zaps are different is that the [BOLT-11] invoice that is created for the person tipping you to pay has a Nostr note in the description. 

In the normal flow you only pass the amount you want to pay when you want to tip someone, [NIP-57] adds a note as well to that request as a query parameter.

The `zap request note` is what is embedded in the description of the [BOLT-11] invoice. Other than that the flow would be that same as a normal Lightning payment.

# Responding to a Zap Request in a Paid Invoice

When someone pays an invoice you created, your lightning node will be notified. In my case (Using [Core Lightning]) there is an rpc method called [`waitanyinvoice`][waitanyinvoice]. This does what it sounds like, it basically blocks until an invoice is paid.

In order to know that you've been zapped you have to watch for paid invoices and check their description for a Nostr note.

Doing this part requires some process you run that watches this for you. In my case I used the [cln-nostr-zapper] to handle it. 

It just runs all the time watching for paid invoices, checks the description, if it is a valid `JSON` object, and a kind `9734` note, then you know you've been zapped.

You can see here in [cln-nostr-zapper] where it checks the description for a valid note of the right kind:

```javascript
function get_zapreq(desc) {
	if (!desc)
		return null

	if (desc.kind === 9734)
		return desc

	return null
}
```

So at this point, you know you've been paid, and you know it's a Zap. But, how do you send a Note to your relay and subsequently your client indicating that? 

# Sending the Zap Note

![image](/images/zap-note.png)

Here is an example of a kind `9735` zap note (containing the kind `9734` zap request note, in the `description` field):

```javascript
{
    "id": "67b48a14fb66c60c8f9070bdeb37afdfcc3d08ad01989460448e4081eddda446",
    "pubkey": "9630f464cca6a5147aa8a35f0bcdd3ce485324e732fd39e09233b1d848238f31",
    "created_at": 1674164545,
    "kind": 9735,
    "tags": [
      [
        "p",
        "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245"
      ],
      [
        "e",
        "3624762a1274dd9636e0c552b53086d70bc88c165bc4dc0f9e836a1eaf86c3b8"
      ],
      [
        "bolt11",
        "lnbc10u1p3unwfusp5t9r3yymhpfqculx78u027lxspgxcr2n2987mx2j55nnfs95nxnzqpp5jmrh92pfld78spqs78v9euf2385t83uvpwk9ldrlvf6ch7tpascqhp5zvkrmemgth3tufcvflmzjzfvjt023nazlhljz2n9hattj4f8jq8qxqyjw5qcqpjrzjqtc4fc44feggv7065fqe5m4ytjarg3repr5j9el35xhmtfexc42yczarjuqqfzqqqqqqqqlgqqqqqqgq9q9qxpqysgq079nkq507a5tw7xgttmj4u990j7wfggtrasah5gd4ywfr2pjcn29383tphp4t48gquelz9z78p4cq7ml3nrrphw5w6eckhjwmhezhnqpy6gyf0"
      ],
      [
        "description",
        "{\"pubkey\":\"32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245\",\"content\":\"\",\"id\":\"d9cc14d50fcb8c27539aacf776882942c1a11ea4472f8cdec1dea82fab66279d\",\"created_at\":1674164539,\"sig\":\"77127f636577e9029276be060332ea565deaf89ff215a494ccff16ae3f757065e2bc59b2e8c113dd407917a010b3abd36c8d7ad84c0e3ab7dab3a0b0caa9835d\",\"kind\":9734,\"tags\":[[\"e\",\"3624762a1274dd9636e0c552b53086d70bc88c165bc4dc0f9e836a1eaf86c3b8\"],[\"p\",\"32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245\"],[\"relays\",\"wss://relay.damus.io\",\"wss://nostr-relay.wlvs.space\",\"wss://nostr.fmt.wiz.biz\",\"wss://relay.nostr.bg\",\"wss://nostr.oxtr.dev\",\"wss://nostr.v0l.io\",\"wss://brb.io\",\"wss://nostr.bitcoiner.social\",\"ws://monad.jb55.com:8080\",\"wss://relay.snort.social\"]]}"
      ],
      [
        "preimage",
        "5d006d2cf1e73c7148e7519a4c68adc81642ce0e25a432b2434c99f97344c15f"
      ]
    ],
    "content": "",
    "sig": "b0a3c5c984ceb777ac455b2f659505df51585d5fd97a0ec1fdb5f3347d392080d4b420240434a3afd909207195dac1e2f7e3df26ba862a45afd8bfe101c2b1cc"
  }

```

This is the note your Zapper (in my case [cln-nostr-zapper]) sends to relays (signed by you this time). The relays that the person sending the zap cares about are embedded in the zap request note so you can send the event to those to ensure they will see it.

After you send the note, if your client supports it, you will see the zap in a notification or on the event itself.


# Summary

Zaps are a modification of the Lightning Address flow which sends a Nostr event from the tipper to the person being tipped. The person being tipped watches to see a paid invoice and if there is one they pass along the note they got. In this way the person being tipped has control over whether or not they want to transmit the event that they've been zapped.

Clients that support displaying kind `9735` events will display this as a Zap.

# Conclusion

I hope this clarifies some things for anyone trying to add support for this themselves. I actually added some support for it on my own blog here, you can see my Zaps listed [here](https://klabo.blog/tip)

If you enjoyed this you can follow me on [Nostr](nostr:2f4fa408d85b962d1fe717daae148a4c98424ab2e10c7dd11927e101ed3257b2).

If you want to try something meta you can Zap my post where I share this and then see your Zap on the tip page, check it out here: [Note sharing this article]()

FYI, if your username doesn't show up right away, reload the page. There is a cache of public keys to usernames that I populate on the backed.

# References

- [NIP-57][NIP-57]
- [cln-nostr-zapper][cln-nostr-zapper]
- [Damus][Damus]
- [Lightning Address]
- [Setting up Lightning Addresss with Core Lightning]

[NIP-57]: https://github.com/nostr-protocol/nips/blob/master/57.md
[cln-nostr-zapper]: https://github.com/jb55/cln-nostr-zapper
[Damus]: https://github.com/damus-io/damus
[def]: /images/damus-zap.jpeg
[joel@klabo.blog]: lightning:joel@klabo.blog
[Lightning Address]: https://lightningaddress.com
[BOLT-11]: https://github.com/lightning/bolts/blob/master/11-payment-encoding.md
[Setting up Lightning Addresss with Core Lightning]: https://klabo.blog/posts/setting-up-lightning-address-with-cln
[Core Lightning]: https://github.com/ElementsProject/lightning
[waitanyinvoice]: https://lightning.readthedocs.io/lightning-waitanyinvoice.7.html