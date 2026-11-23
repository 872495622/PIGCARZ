/** Original errands, lines, and the quest rules. Language strings are {en, zh}. */

export const QUEST_ORDER = ['letter', 'postcard', 'names', 'offering', 'tide'];

export const QUESTS = {
  letter: {
    color: '#c25959',
    steps: 3,
    title: { en: 'The letter that left too soon', zh: '寄得太快的信' },
  },
  postcard: {
    color: '#f3c258',
    steps: 3,
    title: { en: 'A postcard from the trees', zh: '林中的明信片' },
  },
  names: {
    color: '#66bde6',
    steps: 3,
    title: { en: 'Two names, one shelf', zh: '两个几乎一样的名字' },
  },
  offering: {
    color: '#8cc48c',
    steps: 3,
    title: { en: 'An orange for the high step', zh: '送上高台阶的橘子' },
  },
  tide: {
    color: '#de794e',
    steps: 2,
    title: { en: 'The note the tide kept', zh: '潮水留下的纸条' },
  },
};

const T = {
  letter: {
    1: {
      en: 'Ren reads the mail by the clay-red house, past Blue Span. If the letter is still folded, bring it back.',
      zh: '任在青桥过去的赤泥小屋前看信。要是信还叠着，就把它带回来。',
    },
    2: {
      en: 'Take Ren’s reply to Nia in Kettle Square.',
      zh: '把任的回条交给壶广场的妮娅。',
    },
  },
  postcard: {
    1: {
      en: 'Lila sells flowers under the kettle in Kettle Square. Give her Moss’s leaf card.',
      zh: '莉拉在壶广场的大壶下面卖花。把苔的叶子明信片交给她。',
    },
    2: {
      en: 'Bring Lila’s paper flower back to Moss, at the cave in Paper Grove.',
      zh: '把莉拉的纸花带回纸林山洞里的苔。',
    },
  },
  names: {
    1: {
      en: 'Jun stands on the grass under Moss Temple with a coil of bells that belongs at Hum Works.',
      zh: '阿钧在苔寺下面的草地上，抱着一卷该回嗡嗡厂的铃。',
    },
    2: {
      en: 'Take the bells to Jin, at the south door of Hum Works.',
      zh: '把铃交给嗡嗡厂南门的阿津。',
    },
  },
  offering: {
    1: {
      en: 'Carry Auntie Plum’s two oranges up to Brother Calm, at the top of Moss Temple.',
      zh: '把梅姨的两只橘子送到苔寺顶上的静师那里。',
    },
    2: {
      en: 'Take the folded charm back down to Auntie Plum at Quiet Stones.',
      zh: '把折好的符带回静石坡的梅姨。',
    },
  },
  tide: {
    1: {
      en: 'Soren plays where the water falls, past Quiet Stones. Follow the white water. If you lose it, follow the sound.',
      zh: '索伦在静石坡过去的瀑布边弹琴。跟着白水走。走丢了，就跟着声音。',
    },
  },
};

export function objective(id, step) {
  return T[id][step] || null;
}

export function activeQuests(q) {
  return QUEST_ORDER.filter((id) => q[id] > 0 && q[id] < QUESTS[id].steps);
}

export function allDone(q) {
  return QUEST_ORDER.every((id) => q[id] >= QUESTS[id].steps);
}

export function freshQuests() {
  return { letter: 0, postcard: 0, names: 0, offering: 0, tide: 0 };
}

const INTRO = [
  { en: 'I slept past the noon bell.', zh: '我睡过了午钟。' },
  { en: 'Five slips are still in the bag.', zh: '袋子里还压着五张条子。' },
  { en: 'The planet is small. I can walk it.', zh: '这颗星球很小。走一走就到了。' },
];

const LINES = {
  nia: {
    offer: [
      { en: 'I wrote it too hot, and I posted it anyway.', zh: '我写的时候太烫，还是把它寄出去了。' },
      { en: 'Ren reads the mail by the clay-red house, past Blue Span.', zh: '任在青桥过去的赤泥小屋前看信。' },
      { en: 'If it is still folded, bring it back. If it is not, bring me whatever he says.', zh: '要是信还叠着，就带回来。要是已经拆了，就把他的话带给我。' },
    ],
    done: [
      { en: 'He laughed? Out loud?', zh: '他笑了？出声地笑？' },
      { en: 'Then the reply stays in the bag, not in the stove.', zh: '那这张回条就留在袋子里，不进炉子。' },
      { en: 'Thank you. The square feels cooler.', zh: '谢谢你。广场凉快一点了。' },
    ],
    idle: [
      { en: 'I am on my second tea. The first one witnessed the letter.', zh: '这是第二杯茶。第一杯看见了那封信。' },
    ],
  },
  ren: {
    give: [
      { en: 'Ha. She called the stairwell a sad accordion.', zh: '哈。她说楼梯间像一只伤心的手风琴。' },
      { en: 'She is right, and she is funny. The job is hers if she still wants it.', zh: '她说得对，而且好笑。她要是还想要这份工作，就是她的。' },
      { en: 'Take this note back. I will not survive a second copy.', zh: '把这张条子带回去。我经不起第二份。' },
    ],
    idle: [
      { en: 'Mail comes when it comes. I am on the step, not in a hurry.', zh: '信到了就是到了。我在台阶上，不赶。' },
    ],
  },
  moss: {
    offer: [
      { en: 'The square has too many eyes. I counted.', zh: '广场上眼睛太多。我数过。' },
      { en: 'Lila sells flowers under the kettle. This leaf is from the tree we named.', zh: '莉拉在大壶下面卖花。这片叶子来自我们起过名字的那棵树。' },
      { en: 'She will know it. I will be here, behind the dark.', zh: '她认得。我就在这儿，待在暗处。' },
    ],
    done: [
      { en: 'A paper flower. It does not need the square.', zh: '一朵纸花。它不需要广场。' },
      { en: 'I might walk as far as the first cone. Tomorrow.', zh: '我也许能走到第一只锥桶那里。明天。' },
      { en: 'Thank you for carrying the quiet part.', zh: '谢谢你把安静的那一段送过去。' },
    ],
    idle: [
      { en: 'If the wind comes from the square, it smells like tea.', zh: '风要是从广场来，就有茶的味道。' },
    ],
  },
  lila: {
    give: [
      { en: 'Moss’s leaf. He still will not cross the square.', zh: '苔的叶子。他还是不肯穿过广场。' },
      { en: 'Give him this paper flower.', zh: '把这朵纸花给他。' },
      { en: 'Tell him the eyes are mostly people buying tea.', zh: '告诉他，那些眼睛大多是在买茶的人。' },
    ],
    idle: [
      { en: 'The kettle has been empty for years. The flowers do not mind.', zh: '这只壶空了很多年。花并不介意。' },
    ],
  },
  bo: {
    offer: [
      { en: 'Jun and Jin. I have said it slowly. The shelf has not.', zh: '阿钧和阿津。我已经说得很慢。架子没有。' },
      { en: 'Jun is on the grass under Moss Temple, holding bells.', zh: '阿钧在苔寺下面的草地上，抱着铃。' },
      { en: 'The bells belong down here. The seed crate belongs up there. Start with Jun.', zh: '铃该在下面。种子箱该在上面。先去找阿钧。' },
    ],
    idle: [
      { en: 'The shelf is boring again. That was the goal.', zh: '架子又无聊了。这就是目标。' },
    ],
  },
  jun: {
    give: [
      { en: 'I am Jun. The one with the bells, which I did not order.', zh: '我是阿钧。抱着铃的那个。铃不是我订的。' },
      { en: 'The seeds are with Jin, at the south door of Hum Works.', zh: '种子在阿津那儿，嗡嗡厂的南门。' },
      { en: 'Please take the bells down. The hill is trying to become a song.', zh: '请把铃带下去。这面坡快要变成一首歌了。' },
    ],
    idle: [
      { en: 'I can hear the factory from here, which I accept.', zh: '我在这儿听得见工厂。我接受。' },
    ],
  },
  jin: {
    done: [
      { en: 'Bells. Yes. I am Jin. I have been watering seeds by mistake.', zh: '铃。对。我是阿津。我一直在给种子浇水，浇错了。' },
      { en: 'The greenhouse will forgive me if the bells stop arriving.', zh: '铃要是不再送来，温室会原谅我。' },
      { en: 'Tell Bo the shelf is boring again. That is a compliment.', zh: '告诉工头波，架子又无聊了。这是夸奖。' },
    ],
    idle: [
      { en: 'South door sticks. I wait here anyway. It is a good door.', zh: '南门会卡住。我还是在这儿等。这是一扇好门。' },
    ],
  },
  plum: {
    offer: [
      { en: 'My knees and the temple have stopped agreeing.', zh: '我的膝盖和寺庙谈崩了。' },
      { en: 'Brother Calm sits at the top of Moss Temple. The bowl is only two oranges.', zh: '静师坐在苔寺顶上。碗里只有两只橘子。' },
      { en: 'Carry them up. Come back with whatever he folds into paper.', zh: '送上去。他把什么折进纸里，你就带什么回来。' },
    ],
    done: [
      { en: 'He folded it small. He always does.', zh: '他又折得很小。他总是这样。' },
      { en: 'Tell the hill I am still here, only slower.', zh: '告诉那面坡，我还在，只是慢了。' },
      { en: 'You are kind. Sit if you want. The stones do not rush.', zh: '你心好。想坐就坐。石头不催人。' },
    ],
    idle: [
      { en: 'I keep the charm in the orange bowl. Both are round. I like that.', zh: '我把符放在橘子碗里。两个都是圆的。我喜欢。' },
    ],
  },
  calm: {
    give: [
      { en: 'Two oranges. The hill accepts them.', zh: '两只橘子。这面坡收下了。' },
      { en: 'Fold this. It is for knees, and for people who still climb.', zh: '把这个折好。它是给膝盖的，也是给还在往上走的人的。' },
      { en: 'Take it down to Auntie Plum. She will pretend she does not need it.', zh: '带下去给梅姨。她会装作自己不需要。' },
    ],
    idle: [
      { en: 'The wind arrives, then it leaves. Both are fine.', zh: '风来，然后风走。都可以。' },
    ],
  },
  rao: {
    offer: [
      { en: 'I was after clams. The tin was after me.', zh: '我去找蛤蜊。铁盒子来找我。' },
      { en: 'Inside is a letter with one name: Soren.', zh: '里面是一封信，只有一个名字：索伦。' },
      { en: 'He plays where the water falls, past Quiet Stones. Follow the white water, or follow the sound.', zh: '他在静石坡过去的瀑布边弹琴。跟着白水走，或者跟着声音。' },
    ],
    idle: [
      { en: 'The boat is retired. It still faces the sea, out of habit.', zh: '船退休了。它还是朝着海，习惯而已。' },
    ],
  },
  soren: {
    done: [
      { en: 'I wrote this to myself, on a larger day.', zh: '这是我写给自己的，在一个比较大的日子。' },
      { en: 'It says: sit in the sun. The planet is small. You already walked it.', zh: '上面写着：坐到太阳里。星球很小。你已经走过它了。' },
      { en: 'I will keep it, wet or dry. The song can be shorter now.', zh: '我会留着它，湿的干的都行。歌现在可以短一点。' },
    ],
    idle: [
      { en: 'If you stay, the next song is slower.', zh: '你要是留下，下一首会更慢。' },
    ],
  },
  vendor: {
    once: [
      { en: 'The spout of the kettle points toward Blue Span.', zh: '壶嘴对着青桥。' },
      { en: 'Past the blue rails is a clay-red house. You will not miss the color.', zh: '过了蓝色栏杆是一栋赤泥色的房子。那个颜色你不会看错。' },
    ],
  },
  student: {
    once: [
      { en: 'From this bridge the streets bend up at both ends.', zh: '在这座桥上，路的两头都向上弯。' },
      { en: 'I come here to remember that a walk can finish itself.', zh: '我来这儿，是为了记住：走着走着，路会自己走完。' },
    ],
  },
  watch: {
    once: [
      { en: 'The hum is the afternoon shift. It does not take days off.', zh: '这阵嗡嗡是下午班。它不休息。' },
      { en: 'Jin likes the south door. Bo likes the shelf. I like the hum.', zh: '阿津喜欢南门。工头波喜欢架子。我喜欢这阵嗡嗡。' },
    ],
  },
  nova: {
    once: [
      { en: 'You found the far side. There is less mail here.', zh: '你走到远面了。这儿的信少一些。' },
      { en: 'The town is that way. Also that way. On a pebble, both are true.', zh: '镇子在那边。也在那边。在一颗卵石上，两句都对。' },
    ],
  },
  c1: { once: [{ en: 'Same bag, different slips.', zh: '一样的袋子，不一样的条子。' }] },
  c2: { once: [{ en: 'I like the long way. On this planet it is also the short way.', zh: '我喜欢远路。在这颗星球上，远路也是近路。' }] },
  c3: { once: [{ en: 'Wave if you see the temple before I do.', zh: '你要是先看见寺庙，就挥挥手。' }] },
};

export const NPCS = {
  nia: { name: { en: 'NIA', zh: '妮娅' }, role: { en: 'the clerk', zh: '店员' }, quest: 'letter', color: QUESTS.letter.color },
  ren: { name: { en: 'REN', zh: '任' }, role: { en: 'on the step', zh: '台阶上的人' }, quest: 'letter', color: QUESTS.letter.color },
  moss: { name: { en: 'MOSS', zh: '苔' }, role: { en: 'in the cave', zh: '洞里的人' }, quest: 'postcard', color: QUESTS.postcard.color },
  lila: { name: { en: 'LILA', zh: '莉拉' }, role: { en: 'the florist', zh: '花摊' }, quest: 'postcard', color: QUESTS.postcard.color },
  bo: { name: { en: 'BO', zh: '工头波' }, role: { en: 'floor lead', zh: '工头' }, quest: 'names', color: QUESTS.names.color },
  jun: { name: { en: 'JUN', zh: '阿钧' }, role: { en: 'with the bells', zh: '抱着铃' }, quest: 'names', color: QUESTS.names.color },
  jin: { name: { en: 'JIN', zh: '阿津' }, role: { en: 'south door', zh: '南门' }, quest: 'names', color: QUESTS.names.color },
  plum: { name: { en: 'AUNTIE PLUM', zh: '梅姨' }, role: { en: 'at the stones', zh: '静石坡' }, quest: 'offering', color: QUESTS.offering.color },
  calm: { name: { en: 'BROTHER CALM', zh: '静师' }, role: { en: 'at the top', zh: '寺顶' }, quest: 'offering', color: QUESTS.offering.color },
  rao: { name: { en: 'SKIPPER RAO', zh: '饶船主' }, role: { en: 'by the boat', zh: '船边' }, quest: 'tide', color: QUESTS.tide.color },
  soren: { name: { en: 'SOREN', zh: '索伦' }, role: { en: 'the musician', zh: '弹琴的人' }, quest: 'tide', color: QUESTS.tide.color },
  vendor: { name: { en: 'PEACH', zh: '阿桃' }, role: { en: 'tea stall', zh: '茶摊' }, color: '#66bde6' },
  student: { name: { en: 'MIN', zh: '小敏' }, role: { en: 'on the bridge', zh: '桥上' }, color: '#66bde6' },
  watch: { name: { en: 'OLD HU', zh: '老胡' }, role: { en: 'the hum', zh: '听嗡嗡的人' }, color: '#66bde6' },
  nova: { name: { en: 'NOVA', zh: '远星' }, role: { en: 'far side', zh: '远面' }, color: '#66bde6' },
  c1: { name: { en: 'COURIER', zh: '邮差' }, role: { en: 'on a round', zh: '在跑腿' }, color: '#f2c84b' },
  c2: { name: { en: 'COURIER', zh: '邮差' }, role: { en: 'on a round', zh: '在跑腿' }, color: '#f2c84b' },
  c3: { name: { en: 'COURIER', zh: '邮差' }, role: { en: 'on a round', zh: '在跑腿' }, color: '#f2c84b' },
  self: { name: { en: 'COURIER', zh: '邮差' }, role: { en: 'just woke up', zh: '刚醒' }, color: '#66bde6' },
};

export function introLines() {
  return INTRO;
}

/** What happens if the player talks to this person right now. */
export function talk(id, q) {
  const step = (quest) => q[quest];
  if (id === 'nia') {
    if (step('letter') === 0) return act('nia', 'offer', { letter: 1 });
    if (step('letter') === 2) return act('nia', 'done', { letter: 3 });
    return act('nia', 'idle');
  }
  if (id === 'ren') {
    if (step('letter') === 1) return act('ren', 'give', { letter: 2 });
    return act('ren', 'idle');
  }
  if (id === 'moss') {
    if (step('postcard') === 0) return act('moss', 'offer', { postcard: 1 });
    if (step('postcard') === 2) return act('moss', 'done', { postcard: 3 });
    return act('moss', 'idle');
  }
  if (id === 'lila') {
    if (step('postcard') === 1) return act('lila', 'give', { postcard: 2 });
    return act('lila', 'idle');
  }
  if (id === 'bo') {
    if (step('names') === 0) return act('bo', 'offer', { names: 1 });
    return act('bo', 'idle');
  }
  if (id === 'jun') {
    if (step('names') === 1) return act('jun', 'give', { names: 2 });
    return act('jun', 'idle');
  }
  if (id === 'jin') {
    if (step('names') === 2) return act('jin', 'done', { names: 3 });
    return act('jin', 'idle');
  }
  if (id === 'plum') {
    if (step('offering') === 0) return act('plum', 'offer', { offering: 1 });
    if (step('offering') === 2) return act('plum', 'done', { offering: 3 });
    return act('plum', 'idle');
  }
  if (id === 'calm') {
    if (step('offering') === 1) return act('calm', 'give', { offering: 2 });
    return act('calm', 'idle');
  }
  if (id === 'rao') {
    if (step('tide') === 0) return act('rao', 'offer', { tide: 1 });
    return act('rao', 'idle');
  }
  if (id === 'soren') {
    if (step('tide') === 1) return act('soren', 'done', { tide: 2 });
    return act('soren', 'idle');
  }
  if (LINES[id]?.once) return { lines: LINES[id].once, patch: null, flavor: true };
  return { lines: [{ en: '...', zh: '……' }], patch: null, flavor: true };
}

function act(id, key, patch = null) {
  return { lines: LINES[id][key], patch, flavor: !patch };
}

export function hasMark(id, q, heard) {
  const before = talk(id, q);
  if (before.patch) return true;
  if (before.flavor && LINES[id]?.once && !heard.has(id)) return true;
  return false;
}

export function parcelColor(q) {
  if (q.letter === 1 || q.letter === 2) return QUESTS.letter.color;
  if (q.postcard === 1 || q.postcard === 2) return QUESTS.postcard.color;
  if (q.names === 2) return QUESTS.names.color;
  if (q.offering === 1 || q.offering === 2) return QUESTS.offering.color;
  if (q.tide === 1) return QUESTS.tide.color;
  return null;
}

export const EMOTES = [
  { id: 'wave', en: 'wave', zh: '挥手' },
  { id: 'heart', en: 'heart', zh: '心' },
  { id: 'star', en: 'star', zh: '星' },
  { id: 'sun', en: 'sun', zh: '太阳' },
  { id: 'tea', en: 'tea', zh: '茶' },
  { id: 'flower', en: 'flower', zh: '花' },
  { id: 'fish', en: 'fish', zh: '鱼' },
  { id: 'moon', en: 'moon', zh: '月亮' },
  { id: 'spark', en: 'spark', zh: '火花' },
  { id: 'note', en: 'note', zh: '音符' },
];

export const COPY = {
  title: { en: 'PEBBLE POST', zh: '卵石邮局' },
  tag: {
    en: 'A small planet. Five quiet errands.',
    zh: '一颗很小的星球。五件安静的差事。',
  },
  begin: { en: 'BEGIN', zh: '开始' },
  hint: {
    en: 'WASD or arrows to walk · hold the mouse to run toward it · Space to jump · E to talk',
    zh: 'WASD 或方向键走路 · 按住鼠标朝它跑 · 空格跳 · E 说话',
  },
  about: { en: 'ABOUT', zh: '关于' },
  aboutBody: {
    en: 'An unofficial homage to quiet deliveries on a curved street. The walk, the ink outlines, and the paper notes follow that feeling. The town, the people, and the five errands are original. There is no map and no arrow. Place names, the mark over someone’s head, and your slip are the whole guide.',
    zh: '这是一件非官方的致敬：在弯曲的街上，安静地送信。走路的方式、墨线、纸片一样的字条，跟着的是那种感觉。镇子、人和五件差事都是新的。没有地图，也没有箭头。地名、头顶的记号，还有你的条子，就是全部的路引。',
  },
  checklist: { en: 'CHECKLIST', zh: '条子' },
  next: { en: 'NEXT UP', zh: '下一程' },
  received: { en: 'TUCKED IN THE BAG', zh: '放进袋子了' },
  made: { en: 'YOU MADE THE ROUND', zh: '这一圈走完了' },
  madeBody: {
    en: 'All five errands are done. Stay and wander, or begin the day again.',
    zh: '五件差事都送完了。留下再走走，或者把这一天重新开始。',
  },
  stay: { en: 'STAY', zh: '留下' },
  again: { en: 'BEGIN AGAIN', zh: '再来一天' },
  time: { en: 'You were out for', zh: '你在外面' },
  minutes: { en: 'min', zh: '分钟' },
  close: { en: 'Close', zh: '关闭' },
  wardrobe: { en: 'Clothes', zh: '衣服' },
  emotes: { en: 'Emotes', zh: '表情' },
  sound: { en: 'Sound', zh: '声音' },
  list: { en: 'Checklist', zh: '条子' },
  hair: { en: 'Hair', zh: '头发' },
  top: { en: 'Top', zh: '上衣' },
  bottom: { en: 'Bottom', zh: '下装' },
  shoes: { en: 'Shoes', zh: '鞋' },
  talk: { en: 'Talk', zh: '说话' },
  emptyList: {
    en: 'No slips yet. Look for the mark.',
    zh: '还没有条子。去找头顶有记号的人。',
  },
  credit: {
    en: 'Pebble Post is an original fan game. It is not made by, or affiliated with, abeto.',
    zh: '《卵石邮局》是原创的粉丝作品，并非 abeto 制作，也与 abeto 无关。',
  },
};
