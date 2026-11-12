# Request → song creation fulfillment

Accept from Admin → Song Requests now marks the request accepted and redirects to Admin → Create song, with its accepted request selected. The form includes the existing listener-request checkbox and a dropdown of up to 100 accepted requests. Choosing a request fills its title, requested artist, requester and reference video; all fields remain editable.

The create action checks that the selected request is still accepted before saving the song. After the canonical song is created, it atomically updates the request to completed and stores `fulfilledSongMmid` for audit. Completed requests no longer appear in the open request queue or eligible dropdown. Rejection is unchanged.

If song validation or creation fails, the request remains accepted. If the song is created but updating its request fails, the newly created song is shown with an explicit warning not to create the song again. This is not a database transaction spanning song creation and request updates; administrators must reconcile a rare partial failure. Existing historical ingestion records are retained.
