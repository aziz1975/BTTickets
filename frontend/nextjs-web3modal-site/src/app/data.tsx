import React from "react";
const columns = [
    { name: "ID", uid: "id" },
    { name: "TITLE", uid: "title" },
    { name: "DESCRIPTION", uid: "description" },
    { name: "STATUS", uid: "status" },
    { name: "VOTES", uid: "votes" },
    { name: "RAISED BY", uid: "raisedby" },
    { name: "ACTIONS", uid: "actions" },
];

const statusOptions = [
    { name: "NEW", uid: "NEW" },
    { name: "IN_REVIEW", uid: "IN_REVIEW" },
    { name: "DEF", uid: "DEF" },
    { name: "DONE", uid: "DONE" },
    { name: "REJ", uid: "REJ" },
];

const users: any = [
    {
        id: 1,
        title: "TEST1",
        status: "IN_REVIEW",
        description: "Description of project 1",
        votes: "1",
        raisedby: "0xqdjdhasd28347823489jk234ffsf",
    },
    {
        id: 2,
        title: "TEST2",
        status: "IN_REVIEW",
        description: "Description of project 2",
        votes: "2",
        raisedby: "0xqdjdhasd28347823489jk234ffsf",
    },
    {
        id: 3,
        title: "TEST3",
        status: "DONE",
        description: "Description of project 3",
        votes: "9",
        raisedby: "0xqdjdhasd28347823489jk234ffsf",
    },
    {
        id: 4,
        title: "TEST3",
        status: "DONE",
        description: "Description of project 3",
        votes: "9",
        raisedby: "0xqdjdhasd28347823489jk234ffsf",
    },
    {
        id: 5,
        title: "TEST3",
        status: "NEW",
        description: "Description of project 3",
        votes: "9",
        raisedby: "0xqdjdhasd28347823489jk234ffsf",
    },
    {
        id: 6,
        title: "TEST3",
        status: "REJ",
        description: "Description of project 3",
        votes: "9",
        raisedby: "0xqdjdhasd28347823489jk234ffsf",
    },
    {
        id: 7,
        title: "TEST3",
        status: "REJ",
        description: "Description of project 3",
        votes: "9",
        raisedby: "0xqdjdhasd28347823489jk234ffsf",
    },
    {
        id: 8,
        title: "TEST3",
        status: "DEF",
        description: "Description of project 3",
        votes: "9",
        raisedby: "0xqdjdhasd28347823489jk234ffsf",
    },
    {
        id: 9,
        title: "TEST3",
        status: "DEF",
        description: "Description of project 3",
        votes: "9",
        raisedby: "0xqdjdhasd28347823489jk234ffsf",
    },
    {
        id: 10,
        title: "TEST3",
        status: "DEF",
        description: "Description of projectfdfdfdfdfdfdfwerwerdfjsdfhsdufdsufhdufhdfudhfdushfdufhdsufhduhdufhdsufhdufhdsufhdfdufh 3",
        votes: "9",
        raisedby: "0xqdjdhasd28347823489jk234ffsf",
    },

];

export { columns, users, statusOptions };
