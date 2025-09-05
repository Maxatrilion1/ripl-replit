flowchart TD
  %% ================= Onboarding =================
  Start[First run] --> Hints[Minimal onboarding hints (dismissible)]
  Hints --> Home
  Start -->|Skip| Home

  %% ================= Auth =================
  Login[Login screen] --> AuthChoice[Choose Auth Method]
  AuthChoice --> LinkedIn[LinkedIn OAuth]
  AuthChoice --> Manual[Manual profile]
  AuthChoice --> Anonymous[Anonymous join]
  Manual --> ProfileForm[Create profile card<br/>(name + photo + status ≤ 40 chars)]
  ProfileForm --> Home
  LinkedIn --> Home
  Anonymous --> Home

  %% ================= Home =================
  Home --> Solo[Solo Sprint]
  Home --> Session[Sessions]
  Home --> Friends[Friends]
  Home --> Admin[Admin Dashboard]

  %% ================= Solo =================
  Solo --> SetTimer[Select 20 or 40 min]
  SetTimer --> StartSolo[Start sprint]
  StartSolo --> SoloLoading[Loading state]
  StartSolo --> SoloError[Error state (retry)]
  StartSolo --> EndSolo[End sprint]
  EndSolo --> Stats[Update streaks & private badges]
  Stats --> SoloEmpty[Empty state (no history) ]

  %% ================= Sessions =================
  Session --> Lobby[Session lobby]
  Lobby --> InviteView[Invitation view<br/>Teaser attendee photos (Luma-style)]
  InviteView --> JoinCTA[Join session]
  JoinCTA --> JoinChoice[Select how to join]
  JoinChoice --> LinkedInJoin[LinkedIn card]
  JoinChoice --> ManualJoin[Manual card]
  JoinChoice --> AnonJoin[Join anonymously]

  %% ----- Join outcomes
  LinkedInJoin --> InSession[In session]
  ManualJoin --> InSession
  AnonJoin --> InSessionViewOnly[View-only session]
  AnonJoin --> UpgradePrompt[Prompt to create profile to participate]

  %% ================= In-session =================
  InSession --> Participants[Participants list<br/>(full list visible after start)]
  InSession --> PreChat[Pre-session chat]
  InSession --> SprintHub[Create or join sprints]
  InSession --> HostTools[Host tools:<br/>Mute participant chat]
  InSession --> EndSession[End session]

  %% ----- Anonymous constraints
  InSessionViewOnly -.->|Restriction| AnonRules[Anon cannot join sprints or react<br/>Can view lobby & session state only]
  InSessionViewOnly --> UpgradePrompt

  %% ================= Sprints in session =================
  SprintHub --> StartSprint[Set goal + choose 20/40]
  StartSprint --> SharedTimer[Shared timer (server-synced via Supabase Realtime)]
  SharedTimer --> MidReconnect[Reconnect/resume timer]
  SharedTimer --> SprintLoading[Loading state]
  SharedTimer --> SprintError[Error state (rejoin/retry)]
  SharedTimer --> Reactions[Minimal emoji reactions<br/>(non-anon only)]
  SharedTimer --> Finish[Finish sprint]

  %% ----- Post-sprint chat with retention
  Finish --> PostChat[Post-sprint chat<br/>(auto-close after 10–15m idle)]
  PostChat --> FriendReq[One-time message request]
  FriendReq --> Accept[Accept → becomes friend (muted by default)]
  Accept --> FriendsList[Friends list & per-friend mute toggle]
  PostChat --> Archive[Messages retained (no deletion)]

  %% ================= Location / Distance (ON via feature flag) =================
  Lobby --> Create[Create session]:::flagged
  Create --> LinkShare[Generate share link]:::flagged
  Create --> Location[Select location]:::flagged
  Lobby --> JoinLink[Join via link]:::flagged
  JoinLink --> DistanceCheck[Distance check]:::flagged
  DistanceCheck --> InSession
  LinkShare --> InSession

  %% ================= Admin =================
  Admin --> Metrics[View metrics (DAU/WAU, sessions, invites, retention)]
  Admin --> Moderation[Moderation tools:<br/>report/block, soft cap 50]

  %% ================= End session =================
  EndSession --> AutoClose[UI chat closes; data retained]
  EndSession --> SessionArchive[Archive session state]

  %% ================= Edge cases =================
  InSession --> HostLeaves[Host leaves]
  HostLeaves --> SessionPersists[Session persists (no owner lock)]
  MidReconnect --> SharedTimer

  %% ================= Global states =================
  classDef flagged fill:#FFF7E6,stroke:#F5A623,stroke-width:1px,color:#333