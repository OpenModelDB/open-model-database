// eslint-disable-next-line @typescript-eslint/ban-types
export type UpdateRequest<Id, Value extends {}> = ChangeRequest<Id, Value> | DeleteRequest<Id>;
export type ChangeRequest<Id, Value> = { id: Id; value: Value };
export type DeleteRequest<Id> = { id: Id; value?: undefined };

export type ChangeIdRequest<Id> = { id: Id; newId: Id };
