import autoBind from "auto-bind";
import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

const info = <const>{
  name: "sketchpad",
  parameters: {
    image: {
      type: ParameterType.IMAGE,
      default: undefined,
    },
    prompt: {
      type: ParameterType.HTML_STRING,
      default: null,
    },
    regions: {
      type: ParameterType.COMPLEX,
      default: [],
      array: true,
    },
  },
};

type Info = typeof info;

/**
 * **image-text-annotaiton**
 *
 * jsPsych plugin for annotating an image with text labels
 *
 * @author Josh de Leeuw
 * @see {@link https://www.jspsych.org/latest/plugins/image-text-annotation/ image-text-annotation plugin documentation on jspsych.org}
 */
class ImageTextAnnotationPlugin implements JsPsychPlugin<Info> {
  static info = info;
  private img_container: HTMLElement;
  private is_drawing = false;
  private active_box: AnnotationBox;
  private active_label: string;
  private boxes: Array<AnnotationBox> = [];
  private display_element: HTMLElement;
  private deselect_all_flag = true;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    this.display_element = display_element;

    this.add_css();
    this.renderDisplay(trial);
    this.addEvents(trial);

    for (const roi of trial.regions) {
      const box = new AnnotationBox(roi.left, roi.top, this.boxes, this.img_container, this);
      box.setEndCoords(roi.right, roi.bottom);
      box.finishDrawing();
      box.setLabel(roi.label ? roi.label : "?");
      box.setModifiable(false);
    }
  }

  private renderDisplay(trial) {
    let html = `<div id="jspsych-annotation-display">`;
    if (trial.prompt !== null) {
      html += `<div id='instructions'>${trial.prompt}</div>`;
    }
    html += `
      <div id='main-display'>
        <div id='annotated-image-container'>
          <img src="${trial.image}" draggable="false"></img>
        </div>
        <div id='annotation-options'>
          <div><input type="radio" id="opt1" name="annotate_label" value="Foo"><label for="opt1">Foo</label></div>
          <div><input type="radio" id="opt2" name="annotate_label" value="Bar"><label for="opt2">Bar</label></div>
          <div><input type="radio" id="opt3" name="annotate_label" value=""><label for="opt3"><input id="opt3_text" type="text"></label></div>
        </div>
      </div>
    `;
    html += `</div>`;

    this.display_element.innerHTML = html;

    this.img_container = this.display_element.querySelector("#annotated-image-container");
  }

  private addEvents(trial) {
    this.img_container.addEventListener("mousedown", this.start_box);

    const radios = this.display_element.querySelectorAll('input[type="radio"]');
    for (const r of Array.from(radios)) {
      r.addEventListener("change", this.handle_radio_change);
    }

    this.img_container.addEventListener("mousemove", this.sort_boxes);

    document.addEventListener("mousedown", () => {
      this.deselect_all_flag = true;
    });
    document.addEventListener("click", this.deselect_all);

    this.display_element
      .querySelector('input[type="text"]')
      .addEventListener("change", this.add_new_label);
    this.display_element
      .querySelector('input[type="text"]')
      .addEventListener("change", this.update_labels);
  }

  private add_css() {
    document.querySelector("head").insertAdjacentHTML(
      "beforeend",
      `<style id="image-text-annotation-styles">
        #jspsych-annotation-display #main-display {
          display: flex;
        }

        #jspsych-annotation-display #annotated-image-container {
          cursor: crosshair;
          position: relative;
        }

        #jspsych-annotation-display #annotated-image-container img {
          user-select: none;
          display: block;
        }

        #jspsych-annotation-display #annotated-image-container .annotation-box {
          border: 1px solid green;
          position: absolute;
          color:green;
          user-select: none;
        }

        #jspsych-annotation-display #annotated-image-container .annotation-box:hover {
          
        }

        #jspsych-annotation-display #annotated-image-container .annotation-box .annotation-box-label {
          font-size:10px;
          font-family:monospace;
          text-align:left;
          line-height:1em;
          background-color: white;
          border-radius: 5px;
          border: 1px solid white;
          box-shadow: 1px 1px 3px rgba(0,0,0,0.5);
          position:absolute;
          top:2px;
          left:2px;
          padding: 0.5em;
          user-select: none;
          cursor: pointer;
        }

        #jspsych-annotation-display #annotated-image-container .annotation-box .annotation-box-label:hover {
          background-color: #eee;
          border:1px solid #eee;
        }

        #jspsych-annotation-display #annotated-image-container .annotation-box .annotation-box-label.selected {
          border: 1px solid green;
        }

        .annotation-box::before {
          content: "";
          position: absolute;
          height: calc(100% + 24px);
          width: calc(100% + 24px);
          top: -12px;
          left: -12px;
        }

        .annotation-box-remove {
          visibility: hidden;
          user-select: none;
          font-size: 14px;
          font-family: monospace;
          margin: 0px;
          text-align: center;
          line-height: 1em;
          position: absolute;
          left:-16px;
          top: 5px;
          background-color: white;
          color: #777;
          border-radius: 3px;
          box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
          width: 14px;
          height: 14px;
          text-align: center;
          cursor: pointer;
        }

        .annotation-box-resize {
          visibility: hidden;
          width: 14px;
          height: 14px;
          background-color: #00800080;
          border: 1px solid #00800080;
          position: absolute;
          cursor: pointer;
          user-select: none;
        }

        .annotation-box .left {
          left: -8px;
        }

        .annotation-box .top {
          top: -8px;
        }

        .annotation-box .right {
          right: -8px;
        }

        .annotation-box .bottom {
          bottom: -8px;
        }

        .annotation-box.modifiable:hover .annotation-box-remove {
          visibility: visible; 
        }

        .annotation-box.modifiable:hover .annotation-box-resize {
          visibility: visible;
        }

        #jspsych-annotation-display #annotation-options {
          text-align: left;
          padding-left: 24px;
        }
      </style>`
    );
  }

  private start_box(e) {
    const x = Math.round(e.clientX - this.img_container.getBoundingClientRect().left);
    const y = Math.round(e.clientY - this.img_container.getBoundingClientRect().top);

    this.is_drawing = true;

    this.active_box = new AnnotationBox(x, y, this.boxes, this.img_container, this);

    this.img_container.addEventListener("mousemove", this.move_box);
    this.img_container.addEventListener("mouseup", this.stop_box);
  }

  private move_box(e) {
    if (this.is_drawing) {
      const x = Math.round(e.clientX - this.img_container.getBoundingClientRect().left);
      const y = Math.round(e.clientY - this.img_container.getBoundingClientRect().top);

      this.active_box.setEndCoords(x, y);
    }
  }

  private stop_box() {
    if (this.is_drawing) {
      this.active_box.finishDrawing();

      this.active_box.setLabel(this.active_label);

      this.active_box.select();

      this.active_box = null;
      this.img_container.removeEventListener("mousemove", this.move_box);

      this.is_drawing = false;
      this.deselect_all_flag = false;
    }
  }

  private sort_boxes() {
    const original_order = this.boxes.map((box) => box.area());
    const sizes = this.boxes.map((box) => box.area());
    sizes.sort((a, b) => b - a);

    let z = 0;
    for (const s of sizes) {
      this.boxes[original_order.indexOf(s)].setZIndex(z.toString());
      z++;
    }
  }

  select_label(label: string) {
    const radio: HTMLFormElement = this.display_element.querySelector(`input[value='${label}']`);
    if (radio) {
      radio.checked = true;
    } else {
      const radios = this.display_element.querySelectorAll('input[type="radio"]');
      for (const r of Array.from(radios)) {
        (r as HTMLFormElement).checked = false;
      }
    }
  }

  private handle_radio_change(e) {
    this.active_label = (e.target as HTMLFormElement).value;
    for (const b of this.boxes) {
      if (b.isSelected()) {
        b.setLabel(this.active_label);
      }
    }
  }

  private deselect_all(e) {
    if (this.deselect_all_flag && !["RADIO", "LABEL", "INPUT"].includes(e.target.tagName)) {
      for (const b of this.boxes) {
        b.deselect();
      }
    }
  }

  private add_new_label(e) {
    const container = this.display_element.querySelector("#annotation-options");
    const options = container.querySelectorAll('input[type="radio"]').length;
    const html = `
      <div><input type="radio" id="opt${options + 1}" name="annotate_label" value=""><label for="${
      options + 1
    }"><input id="opt${options + 1}_text" type="text"></label></div>
    `;
    container.insertAdjacentHTML("beforeend", html);
    container
      .querySelector(`#opt${options + 1}_text`)
      .addEventListener("change", this.add_new_label);
    container
      .querySelector(`#opt${options + 1}_text`)
      .addEventListener("change", this.update_labels);
    e.target.removeEventListener("change", this.add_new_label);

    container
      .querySelector(`#opt${options + 1}`)
      .addEventListener("change", this.handle_radio_change);
  }

  private update_labels(e) {
    const text = e.target as HTMLFormElement;
    const radio = text.parentElement.parentElement.querySelector(
      'input[type="radio"]'
    ) as HTMLFormElement;

    const old_label = radio.value;
    const new_label = text.value;

    for (const b of this.boxes) {
      if (b.getLabel() == old_label) {
        b.setLabel(new_label);
      }
    }

    radio.value = new_label;
  }
}

class AnnotationBox {
  private label = "?";
  private element: HTMLElement;
  private start_x;
  private start_y;
  private end_x;
  private end_y;
  private drag_offset_x;
  private drag_offset_y;
  private box_list: Array<AnnotationBox>;
  private container: HTMLElement;
  private selected = false;
  private plugin: ImageTextAnnotationPlugin;
  private modifiable = true;

  constructor(x, y, box_list, container, plugin) {
    autoBind(this);

    this.container = container;
    this.box_list = box_list;
    this.plugin = plugin;

    this.setAnchorCoords(x, y);

    const el = document.createElement("div");
    el.classList.add("annotation-box", "modifiable");
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    this.element = el;

    this.container.appendChild(this.element);
  }

  setModifiable(modifiable: boolean) {
    this.modifiable = modifiable;
    if (modifiable) {
      this.element.classList.add("modifiable");
    } else {
      this.element.classList.remove("modifiable");
    }
  }

  setLabel(label) {
    if (label) {
      this.label = label;
    }
    this.element.querySelector(".annotation-box-label").innerHTML = this.label;
  }

  getLabel() {
    return this.label;
  }

  getElement() {
    return this.element;
  }

  setAnchorCoords(x, y) {
    this.start_x = x;
    this.start_y = y;
  }

  setEndCoords(x, y) {
    this.end_x = x;
    this.end_y = y;

    this.updateRenderLocation();
  }

  translate(x, y) {
    this.start_x += x;
    this.start_y += y;

    this.end_x += x;
    this.end_y += y;

    this.updateRenderLocation();
  }

  updateRenderLocation() {
    this.element.style.width = `${Math.abs(this.end_x - this.start_x)}px`;
    this.element.style.height = `${Math.abs(this.end_y - this.start_y)}px`;

    if (this.start_x <= this.end_x) {
      this.element.style.left = `${this.start_x}px`;
    } else {
      this.element.style.left = `${this.end_x}px`;
    }

    if (this.start_y <= this.end_y) {
      this.element.style.top = `${this.start_y}px`;
    } else {
      this.element.style.top = `${this.end_y}px`;
    }
  }

  finishDrawing() {
    this.element.innerHTML = `
      <span class="annotation-box-label"></span>
      <span class="annotation-box-remove">X</span>
      <div class="annotation-box-resize top left"></div>
      <div class="annotation-box-resize top right"></div>
      <div class="annotation-box-resize bottom left"></div>
      <div class="annotation-box-resize bottom right"></div>
    `;

    this.box_list.push(this);

    this.addEvents();
  }

  addEvents() {
    this.element.querySelector(".annotation-box-remove").addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
    this.element.querySelector(".annotation-box-remove").addEventListener("mouseup", (e) => {
      e.stopPropagation();
    });
    this.element.querySelector(".annotation-box-remove").addEventListener("click", (e) => {
      e.preventDefault();
      this.remove();
    });

    this.element
      .querySelector(".annotation-box-resize.bottom.right")
      .addEventListener("mousedown", (e) => {
        const coords = this.element.getBoundingClientRect();
        const container = this.container.getBoundingClientRect();
        this.setAnchorCoords(coords.left - container.left, coords.top - container.top);
        e.stopPropagation();
        this.startMove();
      });

    this.element
      .querySelector(".annotation-box-resize.bottom.left")
      .addEventListener("mousedown", (e) => {
        const coords = this.element.getBoundingClientRect();
        const container = this.container.getBoundingClientRect();
        this.setAnchorCoords(coords.right - container.left, coords.top - container.top);
        e.stopPropagation();
        this.startMove();
      });

    this.element
      .querySelector(".annotation-box-resize.top.right")
      .addEventListener("mousedown", (e) => {
        const coords = this.element.getBoundingClientRect();
        const container = this.container.getBoundingClientRect();
        this.setAnchorCoords(coords.left - container.left, coords.bottom - container.top);
        e.stopPropagation();
        this.startMove();
      });

    this.element
      .querySelector(".annotation-box-resize.top.left")
      .addEventListener("mousedown", (e) => {
        const coords = this.element.getBoundingClientRect();
        const container = this.container.getBoundingClientRect();
        this.setAnchorCoords(coords.right - container.left, coords.bottom - container.top);
        e.stopPropagation();
        this.startMove();
      });

    this.container.addEventListener("mouseup", () => {
      this.stopMove();
    });

    this.element.querySelector(".annotation-box-label").addEventListener("click", (e) => {
      e.stopPropagation();
      this.select();
    });

    this.element.querySelector(".annotation-box-label").addEventListener("mousedown", (e) => {
      if (this.modifiable) {
        this.startDrag(e);
      }
      e.stopPropagation();
    });
  }

  startMove() {
    this.container.addEventListener("mousemove", this.moveHandler);
  }

  moveHandler(e) {
    const container = this.container.getBoundingClientRect();

    let x = Math.round(e.clientX - container.left);
    let y = Math.round(e.clientY - container.top);

    x = Math.min(x, container.width);
    x = Math.max(x, 0);

    y = Math.min(y, container.height);
    y = Math.max(y, 0);

    this.setEndCoords(x, y);
  }

  stopMove() {
    this.container.removeEventListener("mousemove", this.moveHandler);
  }

  startDrag(e) {
    this.drag_offset_x = Math.round(e.clientX - this.element.getBoundingClientRect().left);
    this.drag_offset_y = Math.round(e.clientY - this.element.getBoundingClientRect().top);

    this.container.addEventListener("mousemove", this.dragHandler);
    this.container.addEventListener("mouseup", this.stopDrag);
  }

  stopDrag() {
    this.container.removeEventListener("mousemove", this.dragHandler);
    this.container.removeEventListener("mouseup", this.stopDrag);
  }

  dragHandler(e) {
    const box = this.element.getBoundingClientRect();
    const container = this.container.getBoundingClientRect();

    const box_rel = {
      left: box.left - container.left,
      top: box.top - container.top,
    };

    const x = Math.round(e.clientX - container.left);
    const y = Math.round(e.clientY - container.top);

    let dx = x - this.drag_offset_x - box_rel.left;
    let dy = y - this.drag_offset_y - box_rel.top;

    dx = Math.min(dx, container.width - box_rel.left - box.width);
    dx = Math.max(dx, -box_rel.left);

    dy = Math.min(dy, container.height - box_rel.top - box.height);
    dy = Math.max(dy, -box_rel.top);

    this.translate(dx, dy);
  }

  area() {
    const { width, height } = this.element.getBoundingClientRect();
    return width * height;
  }

  setZIndex(z: string) {
    this.element.style.zIndex = z;
  }

  remove() {
    this.element.remove();
    this.box_list = this.box_list.filter((x) => {
      x !== this;
    });
  }

  select() {
    for (const b of this.box_list) {
      b.deselect();
    }
    this.selected = true;
    this.element.querySelector(".annotation-box-label").classList.add("selected");
    this.plugin.select_label(this.label);
  }

  deselect() {
    this.selected = false;
    this.element.querySelector(".annotation-box-label").classList.remove("selected");
  }

  isSelected() {
    return this.selected;
  }

  showResizeHandles() {
    const handles = this.element.querySelectorAll(".annotation-box-resize");
    // for(const h of handles){
    //   h.style.visibility = 'visible';
    // }
  }
}

export default ImageTextAnnotationPlugin;
