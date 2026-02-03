import { GetInboxEmailsParams } from "./email.types";

export type InboxCategory = NonNullable<GetInboxEmailsParams["category"]>;

export type InboxFilter =
    | "all"
    | "sent"
    | "starred"
    | InboxCategory;