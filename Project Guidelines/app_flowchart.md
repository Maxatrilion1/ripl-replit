



    flowchart TD
    %% ---------- Onboarding ----------
    Start[First run] --> Hints[Minimal onboarding hints]
    Hints --> Home
    Start -->|Skip| Home

    %% ---------- Auth ----------
    Login[Login screen] --> AuthChoice[Choose Auth Method]
    AuthChoice --> LinkedIn[LinkedIn OAuth]
    AuthChoice --> Manual[Manual profile]
    AuthChoice --> Anonymous[Anonymous join]
    LinkedIn --> Home
    Manual --> ProfileForm[Create profile card<br/>(name + photo + status ≤ 40 chars)]
    ProfileForm --> Home
    Anonymous --> Home

    %% ---------- Home ----------
    Home --> Solo[Solo Sprint]
    Home --> Session[Sessions]
    Home --> Friends[Friends]
    Home --> Admin[Admin Dashboard]

    %% ---------- Solo ----------
    Solo --> SetTimer[Select 20 or 40 min]
    SetTimer --> StartSolo[Start sprint]
    StartSolo --> EndSolo[End sprint]
    EndSolo --> Stats[Update streaks & private badges]

    %% ---------- Sessions ----------
    Session --> Lobby[Session lobby]
    Lobby --> InviteView[Invitation view<br/>Teaser attendee photos (Luma-style)]
    InviteView --> JoinCTA[Join session]
    JoinCTA --> JoinChoice[Select how to join]
    JoinChoice --> LinkedInJoin[LinkedIn card]
    JoinChoice --> ManualJoin[Manual card]
    JoinChoice --> AnonJoin[Join anonymously]

    LinkedInJoin --> InSession[In session]
    ManualJoin --> InSession
    AnonJoin --> InSessionViewOnly[View-only session<br/>(no sprint join, no reactions)]
    AnonJoin --> UpgradePrompt[Prompt to create profile to participate]

    %% ---------- In-session ----------
    InSession --> Participants[Participants list<br/>(full list after start)]
    InSession --> PreChat[Pre-session chat]
    InSession --> SprintHub[Create or join sprints]
    InSession --> HostTools[Host tools: Mute participant chat]
    InSession --> EndSession[End session]

    %% ---------- Sprints in session ----------
    SprintHub --> StartSprint[Set goal + 20/40 min]
    StartSprint --> SharedTimer[Shared timer (server-synced)]
    SharedTimer --> Reactions[Minimal emoji reactions]
    SharedTimer --> MidReconnect[Reconnect/resume timer]
    SharedTimer --> Finish[Finish sprint]
    Finish --> PostChat[Post-sprint chat (auto-close 10–15m idle)]
    %% Data retained (not deleted)

    %% ---------- Anonymous constraints ----------
    InSessionViewOnly -.->|Restriction| AnonRules[Anon cannot join sprints or react<br/>View-only until profile created]

    %% ---------- Location / Distance (feature-flag ON) ----------
    Lobby --> Create[Create session]:::flagged
    Lobby --> JoinLink[Join via link]:::flagged
    Create --> LinkShare[Generate share link]:::flagged
    Create --> Location[Select location]:::flagged
    JoinLink --> DistanceCheck[Distance check]:::flagged
    DistanceCheck --> InSession
    LinkShare --> InSession

    %% ---------- Admin ----------
    Admin --> Metrics[View metrics]
    Admin --> Moderation[Moderation tools (report/block, soft cap 50)]

    %% ---------- End session ----------
    EndSession --> Archive[Archive session chats (retain data)]

    classDef flagged fill:#FFF7E6,stroke:#F5A623,stroke-width:1px,color:#333