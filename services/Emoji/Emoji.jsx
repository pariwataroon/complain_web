const emojiList = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','😗','😙','😚','🙂','🤗','🤔',
  '😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓',
  '😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱',
  '🥵','🥶','😳','🤪','😵','😡','😠','🤬','😷','🤒','🤕','🤢','🤮','🤧','😇','🥳','🥺','🤠'
];

export const emojiService = {
  getEmojiList: () => emojiList,
  getRandomEmoji: () => emojiList[Math.floor(Math.random() * emojiList.length)],
  searchEmoji: (keyword) => emojiList.filter(e => e.includes(keyword)),
  getEmojiByIndex: (idx) => {
    if (emojiList.length === 0) return '';
    return emojiList[idx % emojiList.length];
  }
};