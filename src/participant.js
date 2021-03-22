export default class Participant {
   constructor(participantData) {
     this.id = participantData.id;
     //this.message = messageData.message;
     this.name = participantData.senderName || undefined;
   }
 }