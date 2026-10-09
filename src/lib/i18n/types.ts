export type Locale = "ru" | "en" | "kk";

export type Dictionary = {
  nav: {
    profile: string;
    matches: string;
    sessions: string;
    chat: string;
    mentor: string;
    admin: string;
    login: string;
    logout: string;
  };
  home: {
    description: string;
    ctaLoggedIn: string;
    ctaLoggedOut: string;
  };
  register: {
    title: string;
    subtitle: string;
    subtitleOpen: string;
    emailLabel: string;
    consentLabel: string;
    consentError: string;
    submit: string;
    submitting: string;
    genericError: string;
    networkError: string;
    domainError: string;
  };
  checkEmail: { title: string; body: string };
  blocked: { title: string; body: string };
  profile: {
    title: string;
    offerTitle: string;
    wantTitle: string;
    reviewsTitle: string;
    noReviews: string;
    reviewFor: string;
  };
  skills: {
    empty: string;
    namePlaceholder: string;
    levelBeginner: string;
    levelIntermediate: string;
    levelAdvanced: string;
    add: string;
    alreadyAdded: string;
    addError: string;
    removeLabel: string;
  };
  matches: {
    title: string;
    subtitle: string;
    empty: string;
    mutualBadge: string;
    canTeach: string;
    wantsFromYou: string;
    write: string;
  };
  requestSession: {
    wantToLearnGroup: string;
    canTeachGroup: string;
    submit: string;
    dateError: string;
    submitError: string;
    sent: string;
  };
  sessions: {
    title: string;
    subtitle: string;
    empty: string;
    statusPending: string;
    statusAccepted: string;
    statusCancelled: string;
    statusCompleted: string;
    youProposed: string;
    theyProposed: string;
    meetingLink: string;
    write: string;
  };
  sessionActions: {
    meetingLinkPlaceholder: string;
    accept: string;
    complete: string;
    cancel: string;
  };
  review: {
    commentPlaceholder: string;
    submit: string;
    submitError: string;
  };
  report: {
    button: string;
    sent: string;
    reasonPlaceholder: string;
    submit: string;
  };
  chat: {
    listTitle: string;
    listSubtitle: string;
    listEmpty: string;
    threadEmpty: string;
    messagePlaceholder: string;
    send: string;
  };
  admin: {
    title: string;
    subtitle: string;
    usersTitle: string;
    reportsTitle: string;
    noReports: string;
    adminTag: string;
    mentorTag: string;
    blockedTag: string;
    block: string;
    unblock: string;
    resolve: string;
    dismiss: string;
    reportOpen: string;
    reportResolved: string;
    reportDismissed: string;
    mentorApplicationsTitle: string;
    noMentorApplications: string;
    mentorApprove: string;
    mentorReject: string;
  };
  mentor: {
    title: string;
    dashboardSubtitle: string;
    statsRating: string;
    statsSessions: string;
    verifiedSkillsTitle: string;
    noVerifiedSkills: string;
    applyTitle: string;
    applyDescription: string;
    applyMessagePlaceholder: string;
    applySubmit: string;
    applyPending: string;
    applyRejected: string;
    applyError: string;
    verifiedLabel: string;
  };
  notifications: {
    label: string;
    empty: string;
    item: string;
  };
};
