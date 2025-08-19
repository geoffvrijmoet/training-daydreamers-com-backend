**report cards...**

<!-- the preview for bullet points is not correct. it looks correct when clickign "click to edit", but not otherwise. -->

<!-- getting error `NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.` when:
- user clicks "click to edit" on a bullet point in report card
- user adds a link to some text
- user clicks that link -->

<!-- user loses all progress on a report card if they click away from it. we should have it save to mongodb WHILE user is working on report card, not just after they click "create report card". -->

<!-- please make the date not be "2025-08-11" format; it should be "August 11, 2025" format. -->

**notes from when madeline was doing report card in real time...**

<!-- for summary section of report card, user should be able to have full formatting options——italics, bold, embedded links, etc. -->

<!-- in report card email, it should JUST be first name of client - not full name. -->

<!-- get rid of "key points" section in report card email. -->

emails are still saying '[TEST]' in subject line even if they're not test emails.

**client list...**
should be able to click to see their report cards.

show additional contacts in the "client name" column.

the delete button is showing up in the "phone" column and the phone number is showing up below the email in the "email" column.

search bar in client list should happen!

please sort the client list by how recently they were interacted with.

client address should display in the client list.


**"format your report card"...**
<!-- delete button on items is not working. -->

<!-- adding an item adds that element to each element. -->

there should be an option to have an item JUST be a title with link, not need a full description.

when clicking a report card element, the expanded view of a report card element needs to definitely expand long enough to see all items within it. right now, that's not the case.

there should be a search bar in this section.

when adding a hyperlink, often it just immediately resets the form and doesn't let you add the link.


**new client page...**
when user is using "behavior concerns" section, if they do an "other" behavior concern, there should be a checkbox for "add this to the list of behavior concerns", and it should update the mongodb settings document to include that behavior concern. and then gotta make sure that the page pulls from that list of behavior concerns, rather than them being hardcoded. 


**client-side intake form...**
gotta get the LIABILITY WAIVER working.

gotta make sure all inputs are there on this page - from the original google form version.

the vaccination records: 
- in addition to an upload feature, user should be REQUIRED to enter expiration date(s) for the records. this is a temporary fix to ensure people upload real records. THEN, later on, can make an AI parser that quickly figures out the expiration date(s) from the uploaded record(s) and sees if it's a real record.
- there should be a background program that checks when they're coming due. and it should automatically send email reminders to client and admin about that, and a link to upload new records. 


**calendar...**
- when first clicking "connect google calendar," instead of just automatically ticking all calendars that the user connected, IMMEDIATELY give a modal that prompts them to select certain calendars.
- when ticking or unticking a calendar, it completely refreshes the google calendar component. 
- madeline's training hours are 11am - 7pm. there should be a buffer between sessions. there should be a maximum of 4 sessions per day.
- the app will lean on the side of "all the events pulled my google calendar matter and affect her availability". madeline will have to specify which events should NOT affect her availability. 
——eventually, we can have a background process that grabs calendar events and compiles an email to madeline and says "hey, tell us which events should NOT affect your availability."


**client portal...**
- there should be a button at the top that says "not seeing a time that works? text madeline and see what she can do!"
- on the portal/clients/[id] page, gotta make sure their picture is showing up.
- gotta work on the portal/report-cards/[id] page.
- work on the portal/clients/[id]/calendar page - do MONTH format by default.
- there should be a button on training.daydreamersnyc.com page for the client portal.
- heading or subheading somewhere that lays out madeline's working hours:
  - Sunday-Thursday: 11am-7pm


**here's what madeline needs on mobile...**
- check addresses
- check phone numbers
- make report card
- check previous report cards

**training.daydreamersnyc.com...**
<!-- - update mobile view for landing page. it looks BAD right now.
- heading or subheading somewhere that lays out madeline's working hours:
  - Sunday-Thursday: 11am-7pm -->