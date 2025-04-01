import canvas from "canvas";

export default class CnavasBase {
  protected canvas = canvas;
  protected static canvas = canvas;

  public static sliceText(ctx: any, text: string, maxWidth: number): string[] {
    if (ctx.measureText(text).width < maxWidth && !text.includes("\n"))
      return [text];
    let textArray = text.split(" ");

    let textString = "";
    let textStringArray: string[] = [];
    for (let i = 0; i < textArray.length; i++) {
      if (textArray[i].includes("\n")) {
        let newText = textArray[i].trim().split("\n");
        if(ctx.measureText(newText[0]).width > maxWidth ) {
          newText[0] = newText[0].slice(0, ctx.measureText(newText[0]).width - maxWidth - 3) + "...";
        }
        if (ctx.measureText(textString + newText[0]).width > maxWidth) {
          textStringArray.push(textString);
          textString = "";
        }

        textString += newText[0] + " ";

        textStringArray.push(textString);
        textString = "";
        newText.splice(0, 1);
        textArray[i] = newText.join("\n");
        i--;
      } else {
        if(ctx.measureText( textArray[i]).width > maxWidth ) {
          textArray[i] =  textArray[i].slice(0, ctx.measureText( textArray[i]).width - maxWidth - 3) + "...";
        }
        if (ctx.measureText(textString + textArray[i]).width > maxWidth) {
          textStringArray.push(textString);
          textString = "";
        }
        textString += textArray[i] + " ";
      }
    }

    textStringArray.push(textString);
    return textStringArray;
  }
}
