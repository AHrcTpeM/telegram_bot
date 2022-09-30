import TelegramApi, { InlineKeyboardMarkup } from "node-telegram-bot-api";
import 'dotenv/config';
import path from "path";

import { info_book } from './info'

const { BOT_TOKEN } = process.env;

const bot = new TelegramApi(BOT_TOKEN || '', {polling: true});

const againOptions = {
    reply_markup: {
        inline_keyboard: [
            [{text: 'Инфо', callback_data: '/info'}, {text: 'Правила игры', callback_data: '/rule'}, {text: 'Пролог', callback_data: '/game0'}],
            [{text: 'Лист персонажа', callback_data: '/sheet'}, {text: 'Карта', callback_data: '/map'}],
            [{text: 'Начать игру / продолжить', callback_data: '/game'}],
        ]
    }
}

let playerProgress: Record<number, number> = {};

const start = async () => {
    bot.setMyCommands([
        {command: '/start', description: 'Начальное приветствие'},
        {command: '/dice', description: 'Кинуть два кубика'},
        {command: '/map', description: 'Карта'},
        {command: '/note', description: 'Заметка от бота'},
    ])

    bot.on('message', async msg => {
        //console.log(__dirname);
        const text = msg.text;
        const chatId = msg.chat.id;

        try {
            if (text === '/start') {
                await bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/8a1/9aa/8a19aab4-98c0-37cb-a3d4-491cb94d7e12/3.webp')
                return bot.sendMessage(chatId, `Добро пожаловать в телеграм бот Игоря Попкова😁👍
Тут, на досуге, можно почитать интерактивную книгу🎲📖`, againOptions);
            }            
            if (text === '/dice') {
                const dice1 = Math.ceil(Math.random() * 6);
                const dice2 = Math.ceil(Math.random() * 6);

                return bot.sendMessage(chatId, `Кубики: ${dice1} + ${dice2} = ${dice1 + dice2}`);
            }
            if (text === '/map') {
                return bot.sendPhoto(chatId, path.join(__dirname + "/../assets/images/map.png"));
            }
            if (text === '/note') {
                return bot.sendMessage(chatId, `Этот бот создан исключительно в учебных целях, выбор книги в определенном смысле был случайностью.\nСоблюдение правил остается за читателем. У бота нет цели следить за вашей честностью:) Все детали можно записывать на листочке, а можно и просто запоминать.\n\nЧто бы сбросить прогресс - идите на 150 параграф ('150' в чат).`, { reply_markup: {
                    inline_keyboard: [[{text: 'Продолжить игру', callback_data: '/game'}]]
                }});
            }
            if (text === '150') {
                return startGame(chatId, 150);
            }
            if (text === '96') {
                return startGame(chatId, 96);
            }

            return bot.sendMessage(chatId, 'Я тебя не понимаю, попробуй еще раз!)');
        } catch (e) {
            return bot.sendMessage(chatId, 'Произошла какая то ошибочка!)');
        }

    })

    bot.on('callback_query', async msg => {       
        const data = msg.data || 0;
        const chatId = msg.from.id;           

        try {
            if (data === '/rule') {
                return bot.sendMessage(chatId, info_book.rule[0].replace(/(?<=\s)\n/gi, ''), { reply_markup: {
                    inline_keyboard: [[{text: 'Дальше', callback_data: '/rule1'}]]
                }});
            }
            if (data === '/rule1') {
                return bot.sendMessage(chatId, info_book.rule[1].replace(/(?<=\s)\n/gi, ''), { reply_markup: {
                    inline_keyboard: [[{text: 'Дальше', callback_data: '/rule2'}]]
                }});
            }
            if (data === '/rule2') {
                return bot.sendMessage(chatId, info_book.rule[2].replace(/(?<=\s)\n/gi, ''), againOptions);
            }
            if (data === '/info') {
                await bot.sendPhoto(chatId, path.join(__dirname + "/../assets/images/main.jpg"));
                return bot.sendMessage(chatId, info_book.info, againOptions);
            }
            if (data === '/game') {
                return startGame(chatId, playerProgress[chatId] || 1);
            }
            if (data === '/game0') {
                return startGame(chatId, 0);
            }
            if (data === '/map') {
                return bot.sendPhoto(chatId, path.join(__dirname + "/../assets/images/map.png"));
            }
            if (data === '/sheet') {
                return bot.sendPhoto(chatId, path.join(__dirname + "/../assets/images/sheet.png"));
            }            

            return startGame(chatId, +data);
        } catch (e) {
            return bot.sendMessage(chatId, 'Произошла какая то ошибочка!)');
        }
    })
    
    console.log('Bot is running...');
}

start();

const startGame = async (chatId: number, page: number) => {
    playerProgress[chatId] = [83, 116, 150, 151, 204].includes(page) ? 1 : page;
    let pageBook = info_book.book[page].text.replace(/(?<=\s)\n/gi, '');
    let option = info_book.transitions[page].option;
    try {
        await bot.sendPhoto(chatId, path.join(__dirname + `/../assets/images/${page}.png`));
    } catch(err) {}    
    await bot.sendMessage(chatId, pageBook, option);
}