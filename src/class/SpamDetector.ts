export class SpamDetector {
    static isSpam(message: string): boolean {
        const normalizedMessage = message.trim().toLowerCase();

        // 1. Excessive repeated characters (e.g., "heeeeeelloooooo")
        if (/(.)\1{4,}/.test(normalizedMessage)) return true;

        // 2. Repeated words spam (e.g., "hello hello hello")
        if (/\b(\w+)\b(?:\s+\1\b){2,}/i.test(normalizedMessage)) return true;

        // 3. Long special character sequences (e.g., "!!!@@@###$$$")
        if (/[^a-zA-Z0-9\s]{5,}/.test(normalizedMessage)) return true;

        // 4. Short pattern repetition (e.g., "abcabcabcabc")
        if (/^(.+)\1{2,}$/.test(normalizedMessage)) return true;

        // 5. Low unique character count (e.g., "aaaaaeeeeooooo")
        const uniqueChars = new Set(normalizedMessage.replace(/\s+/g, '')).size;
        if (uniqueChars / normalizedMessage.length < 0.3) return true;

        // 6. Excessive spaces or zero-width characters (e.g., "hello⠀⠀⠀⠀⠀⠀world")
        if (/[\u200B-\u200D\uFEFF]/.test(normalizedMessage) || /\s{5,}/.test(normalizedMessage)) return true;

        // 7. Spammy emoji flooding (e.g., "😂😂😂😂😂😂😂😂😂😂")
        if (/(\p{Emoji_Presentation})\1{5,}/u.test(normalizedMessage)) return true;

        // 8. Gibberish detection (e.g., "sksksksk" or "aaaaeeeeiiiiooo")
        if (/([bcdfghjklmnpqrstvwxyz])\1{3,}/i.test(normalizedMessage) || /([aeiou])\1{3,}/i.test(normalizedMessage)) return true;

        // 9. Alternating character spam (e.g., "a1b2c3d4e5")
        if (/([a-zA-Z])\d([a-zA-Z])\d+/i.test(normalizedMessage)) return true;

        // 10. Repetitive short character patterns (e.g., "asdasdasd", "jkljkljkl")
        if (/(\w{2,})\1{2,}/.test(normalizedMessage)) return true;

        // 11. Leetspeak spam (e.g., "h3ll0 h0w 4r3 y0u")
        const leetReplacements: Record<string, string> = { '4': 'a', '3': 'e', '1': 'i', '0': 'o', '7': 't' };
        const leetCount = normalizedMessage.split('').filter(char => leetReplacements[char] !== undefined).length;
        if (leetCount / normalizedMessage.length > 0.4) return true;

        // 12. Excessive punctuation (e.g., "Whaaaaaat??!!!??!!")
        if (/([?!.,])\1{4,}/.test(normalizedMessage)) return true;

        // 13. Fake spacing (h.e.l.l.o or h-e-l-l-o)
        if (/([a-zA-Z])([.\-])\1{3,}/.test(normalizedMessage)) return true;

        // 14. Phonetic spam (lololololol, hahahahehehoho)
        if (/(\b(?:ha|ho|he|lol|lmao)\b){4,}/i.test(normalizedMessage)) return true;

        // 15. Unicode spam (Zalgo text or excessive non-ASCII characters)
        const nonASCII = normalizedMessage.replace(/[\x00-\x7F]/g, '').length;
        if (nonASCII / normalizedMessage.length > 0.4) return true;

        // 16. Weird sentence structure (All caps, No spaces)
        if (/^[A-Z]{10,}$/.test(message)) return true; // ALL CAPS DETECTION
        if (normalizedMessage.length > 20 && !normalizedMessage.includes(" ")) return true; // NO SPACES

        return false;
    }
}
