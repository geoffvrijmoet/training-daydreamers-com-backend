# Project Overview
Use this guide to build a web app that allows a user to manage the backend of Daydreamers Dog Training. It will be hosted at admin.training.daydreamersnyc.com.


# What is Daydreamers Dog Training?
    Daydreamers Dog Training is a dog training business that offers private training sessions for dogs and their owners. For now, Madeline Pape is the only trainer. She services NYC and the surrounding areas. The landing page is https://training.daydreamersnyc.com. This landing page has information about Madeline, the services she offers, and her training philosophy. There is a contact form on the landing page for people to get in touch with Madeline.

    Madeline has three ways of finding new clients: 
    1. The landing page at https://training.daydreamersnyc.com
    2. Jordan's Pet Care (https://www.jordanspetcare.com/), a pet sitting service that refers clients to Madeline for private training sessions.
    3. School For The Dogs (https://schoolforthedogs.com/), a dog training school that refers clients to Madeline for private training sessions.

    When clients book sessions with Madeline directly (not using Jordan's Pet Care or School For The Dogs), the client pays the parent company of Daydreamers Dog Training, which is Daydreamers Pet Supply LLC, a two-person LLC registered in New York. Madeline is a 50% owner of Daydreamers Pet Supply LLC. Sales tax is collected on all services rendered, and sales tax is included in the price Madeline charges for her services.

    When clients book sessions with Madeline using Jordan's Pet Care or School For The Dogs, the client pays Jordan's Pet Care or School For The Dogs directly, not Daydreamers Pet Supply LLC. Madeline does not collect payment for these sessions. Then, School For The Dogs and Jordan's Pet Care separate out the percentage of the payment that is allocated for sales tax, and send that money to the appropriate tax authority. Then, they split the remaining amount with Madeline. When they pay Madeline, they pay Daydreamers Pet Supply LLC, in which Madeline is a 50% owner.

    Madeline has a calendar of upcoming sessions. When a client books a session, Madeline adds it to her calendar.

    Madeline has a list of clients. When a new client books a session, Madeline adds them to her list of clients. A new Google Drive folder is created for the client. In that client folder, there should be a folder called "Client Folder" which will be shared with the client; all resources that Madeline wants to share with the client should go in this folder. Resources that Madeline does not want to share with the client should go in the "Private" folder. The Google Drive parent folder for everything related to Daydreamers Dog Training is https://drive.google.com/drive/folders/1lvbkXMSo5Tu7Cri3Y4cgj8taLMx2mEbx. The folder named "Clients" is the parent folder for all client folders. There is a folder called "PDFs and Resources" in the Daydreamers Dog Training folder, which contains all the PDFs and resources Madeline has for training.

    When Madeline completes a training session with a client, she creates a new Report Card for that session. The Report Card is a Google Doc that is created in the Client Folder for the client. The Report Card contains information about the session, including what was worked on, what was accomplished, and any notes Madeline has about the session. Madeline shares a PDF version of the Report Card to the client.


# Feature Requirements
    ==Report Cards==
    There should be a button for Madeline to create a new Report Card for a client. This should open a new page in the same window, where input fields allow Madeline to fill in the details of the session. The input fields should be:
        - Date of session
        - Name of client
        - Dog's name
        - Summary of session
        - Key Concepts
            - These key concepts should be selected from a dropdown menu of common key concepts. There should be a place in Madeline's dashboard where she can add new key concepts to the dropdown menu.
        - Product Recommendations
            - These should be selected from a dropdown menu of products Madeline has available for purchase. There should be a place in Madeline's dashboard where she can add new products to the dropdown menu.
    When Madeline creates a new Report Card, the Report Card should be created in the Client Folder for that client in Google Drive. After a Report Card is created, Madeline should be presented with a link to the Google Drive Client Folder, and there should be a button to send the Report Card to the client via email.

    ==Clients==
    There should be a button for Madeline to create a new client. This should open a new page in the same window, where input fields allow Madeline to fill in the details of the client. The input fields should be:
        - Name of client
        - Dog's name
        - Email address
        - Phone number
        - Notes
    When Madeline creates a new client, a new Google Drive Client Folder should be created for the client. Madeline should be presented with a link to the Google Drive Client Folder.

    - The web app should have lightning-fast performance.
    - The entire app should be extremely mobile-friendly. Madeline needs to be able to access the app on her phone.
    - We will use Next.js, Shadcn, Lucid, Clerk, MongoDB, and Tailwind CSS to build the app.
    - Madeline should be able to log into the app using her Google account (madjpape@gmail.com), the Daydreamers google account (info@daydreamersnyc.com), her phone number (971-645-6827), or her Apple ID (madjpape@gmail.com). Users who do not have one of these accounts will not be able to log in. In the backend of the app, all of these sign-in methods should be treated as the same user, and regardless of which sign-in method is used, Madeline should be able to access the same data and have all the same app functionality.


# Relevant Docs
This is the reference documentation for Clerk: https://clerk.com/docs/references/nextjs/


# Current File Structure
TRAINING-DAYDREAMERS-COM-BACKEND
├── app/
│   ├── fonts/
│   │   ├── GeistMonoVF.woff
│   │   └── GeistVF.woff
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── guidelines/
│   └── feature-doc-guideline.md
├── lib/
│   └── utils.ts
├── node_modules/
├── .cursorrules
├── .env.local
├── .eslintrc.json
├── .gitignore
├── components.json
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
└── tsconfig.json


# Rules
- All new components should go in /components and be named like example-component.tsx unless otherwise specified.
- All new pages go in /app.