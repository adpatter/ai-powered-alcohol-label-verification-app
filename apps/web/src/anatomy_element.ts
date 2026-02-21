export class Anatomy extends HTMLElement {
  static observedAttributes = [];

  protected styleSheet: HTMLStyleElement;
  private initialized: boolean;

  constructor() {
    super();
    this.initialized = false;

    this.styleSheet = document.createElement("style");
    this.styleSheet.textContent = `
    *,
    *::before,
    *::after {
      box-sizing: border-box;
      margin: 0;
    }

    .anatomy {
      display: flex;
      flex-direction: column;
      width: 100%;
      border: 1px solid #000000;
      padding: 1rem;
      gap: 1rem;
    }

    .body-part {
      display: flex;
      gap: 1rem;
    }

    form {
      display: flex;
      flex-direction: column;
    }
    
    form .field {
      flex-grow: 1;
      flex-shrink: 1;
      flex-basis: 0%;
      height: 2rem;
      font-size: 16px;
    }

    form textarea.field {
      height: 12rem;
    }
    
    form label {
      width: 100px;
    }
    
    form .body-part {
      margin-bottom: 1rem;
      align-items: center;
    }

    .status {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      margin-left: 4px;
    }

    .status-green  { background-color: green; }
    .status-red    { background-color: red; }
    .status-yellow { background-color: gold; }
    .status-grey   { background-color: grey; }
  `;
  }

  connectedCallback() {
    try {
      if (this.initialized) {
        return;
      }
      this.initialized = true;
      this.setAttribute("id", "anatomy");
      this.setAttribute("class", "anatomy");
      this.appendChild(this.styleSheet);
      const h3 = document.createElement("h3");
      h3.setAttribute("id", "anatomy-label-type");
      h3.textContent = "Distilled Spirits";
      const form = document.createElement("form");
      const bodyParts = [
        {
          part: "brand-name-part",
          content: "Brand Name",
        },
        {
          part: "class-part",
          content: "Class",
        },
        {
          part: "alcohol-content-part",
          content: "Alcohol Content",
        },
        {
          part: "net-contents-part",
          content: "Net Contents",
        },
        {
          part: "government-warning-part",
          content: "Government Warning",
        },
      ].map((value) => {
        const div = document.createElement("div");
        div.classList.add("body-part", value.part);
        const label = document.createElement("label");
        label.setAttribute("for", value.part);
        label.textContent = value.content;
        const input =
          value.part == "government-warning-part"
            ? document.createElement("textarea")
            : document.createElement("input");
        input.setAttribute("name", value.part);
        input.setAttribute("id", value.part);
        input.classList.add(value.part, "field");

        if (value.part == "government-warning-part") {
          input.value = `GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.`;
        } else {
          input.setAttribute("type", "text");
        }

        if (value.part == "brand-name-part") {
          input.setAttribute("value", "Captain John's");
        } else if (value.part == "class-part") {
          input.setAttribute("value", "Rum with natural flavors added");
        } else if (value.part == "alcohol-content-part") {
          input.setAttribute("value", "20% Alcohol by volume (40 proof)");
        } else if (value.part == "net-contents-part") {
          input.setAttribute("value", "750 ml");
        }

        const status = document.createElement("span");
        status.setAttribute("class", value.part);
        status.classList.add("status", "status-grey");
        div.appendChild(label);
        div.appendChild(input);
        div.appendChild(status);
        return div;
      });
      form.append(...bodyParts);
      this.appendChild(h3);
      this.appendChild(form);
    } catch (err) {
      console.error(err);
    }
  }

  public processResponse(data: string): void {
    try {
      console.log(data);
      data = data.toLowerCase();
      const results = [
        ...data.matchAll(
          /(brand name|class|alcohol content|net contents|government warning)\s+classification:\s*(not match|match)/gm
        ),
      ].map((m) => ({
        name: m[1].trim(),
        value: m[2].trim(),
      }));

      for (const props of results) {
        const { name, value } = props;
        if (name == "brand name") {
          const status = this.querySelector(`div.brand-name-part span.status`);
          if (status) {
            this.setStatusClass(status, value);
          }
        } else if (name == "class") {
          const status = this.querySelector(`div.class-part span.status`);
          if (status) {
            this.setStatusClass(status, value);
          }
        } else if (name == "alcohol content") {
          const status = this.querySelector(`div.alcohol-content-part span.status`);
          if (status) {
            this.setStatusClass(status, value);
          }
        } else if (name == "net contents") {
          const status = this.querySelector(`div.net-contents-part span.status`);
          if (status) {
            this.setStatusClass(status, value);
          }
        } else if (name == "government warning") {
          const status = this.querySelector(`div.government-warning-part span.status`);
          if (status) {
            this.setStatusClass(status, value);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  public disconnectedCallback(): void {
    try {
      console.log(`Custom element ${this.id} removed from page.`);
    } catch (err) {
      console.error(err);
    }
  }

  public connectedMoveCallback(): void {
    try {
      console.log(`Custom element ${this.id} moved with moveBefore()`);
    } catch (err) {
      console.error(err);
    }
  }

  public adoptedCallback(): void {
    try {
      console.log(`Custom element ${this.id} moved to new page.`);
    } catch (err) {
      console.error(err);
    }
  }

  public attributeChangedCallback(name: string, oldValue: unknown, newValue: unknown): void {
    try {
      console.log(`Attribute ${name} has changed: ${String(oldValue)} -> ${String(newValue)}.`);
    } catch (err) {
      console.error(err);
    }
  }

  public setStatusClass(status: Element, value: unknown) {
    status.classList.remove("status-green", "status-red", "status-yellow", "status-grey");
    if (value == "match") {
      status.classList.add("status-green");
    } else if (value == "not match") {
      status.classList.add("status-red");
    } else {
      status.classList.add("status-yellow");
    }
  }

  public setErrorState() {
    for (const status of this.querySelectorAll(".status")) {
      status.classList.add("status-red");
    }
  }

  public unsetErrorState() {
    for (const status of this.querySelectorAll(".status")) {
      status.classList.remove("status-green", "status-red", "status-yellow", "status-grey");
      status.classList.add("status-grey");
    }
  }

  public setAnatomyLabelType(type: string) {
    const h3 = this.querySelector("#anatomy-label-type");
    if (h3) {
      h3.textContent = type;
    }
  }
}

customElements.define("anatomy-element", Anatomy);
