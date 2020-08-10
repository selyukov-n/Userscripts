// ==UserScript==
// @name         Duolingo - Easy Accents Mod
// @description  Makes typing characters with accents and diacritics easy! Just use the Alt key!
// @match        *://www.duolingo.com/*
// @author       @HodofHod, Ennorion
// @version      0.2.2-mod
// ==/UserScript==

/*
Copyright (c) 2013-2014 HodofHod (https://github.com/HodofHod)

Licensed under the MIT License (MIT)
Full text of the license is available at https://raw2.github.com/HodofHod/Userscripts/master/LICENSE
*/

// Technically, these are accents, diacritics, and ligatures,
// but accents is the commonest of those terms so that's the script's title.
// Some languages have characters that can be accented in many different ways
// (like the French 'e' or the Portuguese 'a'). While those letters are reachable by tapping ALT multiple times, 
// it may become unweildy and annoying. I am open to other suggestions.

function inject(f) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.setAttribute('name', 'easy_accents');
    script.textContent = '(' + f.toString() + ')()';
    document.body.appendChild(script);
}

inject(main);
function main(){
    console.log('Duo Easy Accents');
    var maps = {
        es: {'A':'á', 'E':'é', 'I':'í', 'O':'ó', 'U':'úü',                    // Spanish
             'N':'ñ', '1':'¡', '!':'¡', '?':'¿', '/':'¿', '7':'¿'},
        ca: {'A':'à', 'E':'éè', 'I':'íï', 'O':'óò', 'U':'úü', 'C':'ç', '.':'·'}, // Catalan
        fr: {'A':'àâæ', 'E':'èéêë', 'I':'îï', 'O':'ôœ', 'U':'ùûü', 'C':'ç'},  // French
        pt: {'A':'ãáâà', 'E':'éê', 'I':'í', 'O':'õóô', 'U':'úü', 'C':'ç'},    // Portuguese 
        de: {'A':'ä', 'O':'ö', 'U':'ü', 'S':'ß'},                             // German
        fi: {'A':'ä', 'O':'ö'},                                               // Finnish
        it: {'A':'àá', 'E':'èé', 'I':'ìí', 'O':'òó', 'U':'ùú'},               // Italian
        pl: {'A':'ą', 'C':'ć', 'E':'ę', 'L':'ł', 'N':'ń',                     // Polish
             'O':'ó', 'S':'ś', 'X':'ź', 'Z':'żź'},
        ro: {'A':'ăâ', 'I':'î', 'S':'şș', 'T':'ţț'},                          // Romanian
        hu: {'A':'á', 'E':'é', 'I':'í', 'O':'öóő', 'U':'üúű'},                // Hungarian
        dn: {'A':'á', 'E':'éèë', 'I':'ï', 'O':'óö', 'U':'ü'},                 // Dutch (Netherlands)
        tr: {'C':'ç', 'G':'ğ', 'I':'ıİ', 'O':'ö', 'S':'ş', 'U':'ü'},          // Turkish
        da: {'A':'æå', 'O':'ø'},                                              // Danish
        nb: {'A':'åæ', 'O':'ø', 'E':'é'},                                     // Norwegian
        ga: {'A':'á', 'E':'é', 'I':'í', 'O':'ó', 'U':'ú'},                    // Irish
        sv: {'A':'åä', 'O':'ö', 'E':'é'},                                     // Swedish
        eo: {'C':'ĉ', 'G':'ĝ', 'H':'ĥ', 'J':'ĵ', 'S':'ŝ', 'U':'ŭ'},           // Esperanto
        cs: { 'A': "á", C: "č", D: "ď", E: "éě", I: "í", N: "ň", O: "ó",      // Czech
             R: "ř", S: "š", T: "ť", U: "úů", Y: "ý", Z: "ž" },
        additional: {'W':'ŵ', 'Y':'ŷ'}
        },
        taps = 0,
        last_press = [];
    maps["no-BO"] = maps.nb; // Duo lang for Norwegian (Bokmal) is sometimes 'no-BO' instead of 'nb'

    function getLang(trg) {
        var l = trg.lang;
        if (trg.nodeName === "BODY") l = "";

        if (l) return l;

        var duoState = localStorage["duo.state"] && JSON.parse(localStorage["duo.state"]);
        return duoState.user.learningLanguage || trg.lang;
    }

    function onKeyDown(e) {
        var lng = getLang(e.target);
        if (lng && lng === "en")
            return;

        //If the pressed key isn't already pressed, return
        if (!e.altKey || e.which===18) { return; }
        //If the same key is pressed in a short period of time, increment taps
        taps = (last_press[0] === e.which && new Date() - last_press[1] <= 750) ? taps+1 : 1;
        //Get accented chr; taps-1 is the 0-indexed accented chr to get.
        var origChar = e.which === 190 ? '.' : e.which === 191 ? '/' : String.fromCharCode(e.which);
        var chr = get_char(lng, origChar, taps-1);
        if (!chr){ return true; }
        chr = e.shiftKey ? chr.toUpperCase() : chr;
        //Insert chr into textarea; Replace last chr for multiple taps by taps>1
        insert_char(e.target, chr, taps>1);
        last_press = [e.which, new Date()];
        //To override any other Alt+<x> hotkeys.
        return true;
    }

    function getCharList(base) {
        // var allChars = $(".I1fg4 ._2JSLn ._1tSEs._2Hv7w") //$(".vkeyboard_key[key]")
        //     .text().toLowerCase().split('');
        var allChars = []; // it needs to be searched another way; skip this logic for a while
        // TODO try document.querySelectorAll("textarea[data-test^=challenge-] ~ div button")
        var chars = "";
        for(var keyLang in maps) {
            if (maps.hasOwnProperty(keyLang)) {
                var list = maps[keyLang][base];
                if (list) chars += list;
            }
        }

        var clist = allChars.filter(function(c) { return chars.indexOf(c) > -1; });
        return clist.join('');
    }

    function get_char(lang, base, index){
        var char_lst = lang && maps[lang] && maps[lang][base]
            || getCharList(base);
        return char_lst && char_lst[index % char_lst.length];
    }

    function insert_char(textarea, new_char, del){
        var text = textarea.value,
            start = textarea.selectionStart,
            end = textarea.selectionEnd;
        //Insert the character. If we're rotating through alternate letters, remove the last character.
        textarea.value = text.slice(0, del ? end-1 : start) + new_char + text.slice(end);
        //Move the caret. If deleting the previous, the caret should remain. (Hence x+!del)
        //If replacing selected text (and not deleting previous), caret should unselect and be start+1
        textarea.setSelectionRange(start+!del, (end-start&&!del ? start : end) +!del);
    }

    function onKeyUp(e) {
        if (e.which === 18){ //ALT keyup
            var lng = getLang(e.target);
            if (lng && lng === "en")
                return;
            //Reset the last tapped key.
            last_press = [];
            //This ALT keyup isn't from an ALT+<x> combo, so modify the last char
            if (taps===0){
                var t = e.target;
                var base = t.value.slice(t.selectionEnd-1, t.selectionEnd),
                    index;
                for(var key in maps[lng]) {
                    index = maps[lng][key].indexOf(base.toLowerCase());
                    if (index > -1){
                        base = (base.toUpperCase() === base) ? key : key.toLowerCase();
                        break;
                    }
                }
                var chr = get_char(lng, base.toUpperCase(), index+1);
                if (!chr){ return true; }
                chr = /[A-Z]/.test(base) ? chr.toUpperCase() : chr;
                insert_char(t, chr, true);
            }
            taps = 0;
            return true;
        }
    }

    const subscribe = (event, handler) => document
        .addEventListener(event, function (e) {
            if (handler(e)) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

    subscribe("keydown", onKeyDown);
    subscribe("keyup", e => e.target.lang !== "en" && onKeyUp(e));
}
