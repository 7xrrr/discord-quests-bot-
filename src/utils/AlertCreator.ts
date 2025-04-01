import path from "path";
import CnavasBase from "../core/canvas";

export enum AlartType {
  ERROR,
  WARNING,
  INFO,
  SUCCESS,
}

export enum TextAlignment {
  LEFT,
  CENTER,
  RIGHT,
}

export class AlertCreator extends CnavasBase {
  // * Canvas dimensions
  protected static cardWidth = 400;
  protected static cardHeight = 100;

  protected static images = {
    [AlartType.ERROR]: path.join(__dirname, ".", "assets", "error_frame.png"),
    [AlartType.WARNING]: path.join(
      __dirname,
      ".",
      "assets",
      "warning_frame.png"
    ),
    [AlartType.INFO]: path.join(__dirname, ".", "assets", "info_frame.png"),
    [AlartType.SUCCESS]: path.join(__dirname, ".", "assets", "success_frame.png"),
  };

  protected static TextColors = {
    [AlartType.ERROR]: "#ffa2a2",
    [AlartType.WARNING]: "#ffda6a",
    [AlartType.INFO]: "#6edff6",
    [AlartType.SUCCESS]: "#92e1c0",
  };

  protected static TextProperties = {
    fontSize: 18,
    lineHeight: 22,
    paddingX: 15,
  };

  public static async alert(type: AlartType , alignment: TextAlignment, error: string): Promise<Buffer> {
    const { canvasInstance, ctx } = await this.creatCardImage(
      this.images[type]
    );

    ctx.font = `${this.TextProperties.fontSize}px Arial`;
    ctx.fillStyle = this.TextColors[type];

    let lines = this.sliceText(
      ctx,
      error,
      this.cardWidth - this.TextProperties.paddingX * 2
    );

    // * Calculate total text height
    let totalTextHeight = lines.length * this.TextProperties.lineHeight;
    if (totalTextHeight > this.cardHeight) {
      if (
        ctx.measureText(lines[3]).width + ctx.measureText("...").width <
        this.cardWidth - this.TextProperties.paddingX * 2
      ) {
        lines[3] += "...";
      } else {
        lines[3] = lines[3].slice(0, lines[3].length - 3) + "...";
      }
      lines = lines.slice(0, 4);
      totalTextHeight = lines.length * this.TextProperties.lineHeight;
    }

    const startY =
      (this.cardHeight - totalTextHeight) / 2 + this.TextProperties.fontSize;

    // * draw the error message lines and center them
    for (let i = 0; i < lines.length; i++) {
      // * Calculate x position based on alignment
      const x =
        alignment === TextAlignment.CENTER
          ? this.cardWidth / 2 - ctx.measureText(lines[i]).width / 2
          : alignment === TextAlignment.LEFT
          ? this.TextProperties.paddingX
          : this.cardWidth - this.TextProperties.paddingX - ctx.measureText(lines[i]).width;

      // * Position each line vertically with proper spacing
      const y = startY + i * this.TextProperties.lineHeight;

      ctx.fillText(lines[i], x, y);
    }

    return canvasInstance.toBuffer();
  }

  protected static async creatCardImage(image: string) {
    const canvasInstance = this.canvas.createCanvas(
      this.cardWidth,
      this.cardHeight
    );
    const ctx = canvasInstance.getContext("2d");
    const bgImageFrame = await this.canvas.loadImage(image);
    ctx.drawImage(bgImageFrame, 0, 0, this.cardWidth, this.cardHeight);

    return {
      canvasInstance,
      ctx,
    };
  }
}
