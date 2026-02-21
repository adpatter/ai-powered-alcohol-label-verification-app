import { Anatomy } from "./anatomy_element";
import { isValidResponse } from "./types";

export class LabelVerificationElement extends HTMLElement {
  static observedAttributes = ["api-url"];

  private shadow: ShadowRoot;
  private apiURL?: string;
  private anatomy: Anatomy;
  private initialized: boolean;
  constructor() {
    super();
    this.initialized = false;
    this.shadow = this.attachShadow({ mode: "open" });
    this.anatomy = document.createElement("anatomy-element") as Anatomy;
    const style = document.createElement("style");
    style.textContent = `
    :host(#label-verification){
      display: flex;
      flex-direction: column;
      width: 100%;
      border: 1px solid #000000;
      padding: 1rem;
      gap: 1rem;
      background-color: #eeeeee;
    }

    .column-div {
      display: flex;
      flex-direction: row;
      gap: 1rem;
      width: 100%;
    }

    .row-div {
      width: 50%;
      gap: 1rem;
    }

    #left-panel {
      display: flex;
      flex-direction: column;
      background: #ffffff;
      flex: 1;
      border-radius: 8px;
    }

    #right-panel {
      display: flex;
      flex-direction: row;
      align-items: center; 
      overflow-x: auto;
      overflow-y: hidden;
      background: #ffffff;
      flex: 1;
      border-radius: 8px;
    }

    #right-panel img {
      height: 100%;
      max-height: 480px;
      margin: 5px;
    }

    #panel-div .row-div {
      border: 1px solid #000000;
      padding: 1rem;
    }

    #label-type-selector {
      width: 100%;
      font-size: 16px;
      height: 2rem;
    }

    button {
      background: #ffffff;
      border: 1px solid #333333;
      font-size: 18px;
      padding: 10px;
      border-radius: 8px;
    }

    button:hover {
      cursor: pointer;
    }

    .spinner {
      display: none;
      width: 24px;
      height: 24px;
      margin-left: 10px;
      border: 6px solid #ccc;
      border-top: 6px solid #333;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      vertical-align: middle;
    }

    .spinner.active {
      display: inline-block;
    }

    .error {
      display:none;
      color: red;
      margin-left: 10px;
    }
    
    .error.active {
      display: inline-block;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    `;
    this.shadow.appendChild(style);
  }

  connectedCallback() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.setAttribute("id", "label-verification");

    const panelDiv = document.createElement("div");
    panelDiv.setAttribute("class", "column-div");
    panelDiv.setAttribute("id", "panel-div");

    const leftPanel = document.createElement("div");
    leftPanel.setAttribute("id", "left-panel");
    leftPanel.classList.add("row-div");

    const rightPanel = document.createElement("div");
    rightPanel.setAttribute("id", "right-panel");
    rightPanel.classList.add("row-div");

    const h2 = document.createElement("h2");
    h2.textContent = "Label type";

    const select = document.createElement("select");
    select.setAttribute("id", "label-type-selector");
    select.setAttribute("name", "select");

    const option1 = document.createElement("option");
    option1.innerText = "Distilled Spirits";
    option1.setAttribute("value", "distilled-spirits");

    const option2 = document.createElement("option");
    option2.innerText = "Beer";
    option2.setAttribute("value", "beer");

    const option3 = document.createElement("option");
    option3.innerText = "Wine";
    option3.setAttribute("value", "wine");

    select.append(option1, option2, option3);

    leftPanel.appendChild(h2);
    leftPanel.appendChild(select);
    leftPanel.appendChild(this.anatomy);

    panelDiv.appendChild(leftPanel);
    panelDiv.appendChild(rightPanel);

    const buttonDiv = document.createElement("div");
    buttonDiv.setAttribute("class", "column-div");
    buttonDiv.setAttribute("id", "button-div");

    const leftButtonDiv = document.createElement("div");
    leftButtonDiv.setAttribute("class", "row-div");
    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    const spinner = document.createElement("span");
    spinner.setAttribute("class", "spinner");
    const error = document.createElement("span");
    error.textContent = "Server Error";
    error.classList.add("error");
    leftButtonDiv.appendChild(submitButton);
    leftButtonDiv.appendChild(spinner);
    leftButtonDiv.append(error);

    const rightButtonDiv = document.createElement("div");
    rightButtonDiv.setAttribute("class", "row-div");
    const filesInput = document.createElement("input");
    filesInput.setAttribute("type", "file");
    filesInput.setAttribute("multiple", "");
    filesInput.setAttribute("hidden", "");
    const uploadButton = document.createElement("button");
    uploadButton.textContent = "Upload Label Images";
    rightButtonDiv.appendChild(filesInput);
    rightButtonDiv.appendChild(uploadButton);

    buttonDiv.append(leftButtonDiv, rightButtonDiv);

    this.shadow.appendChild(panelDiv);
    this.shadow.append(buttonDiv);

    submitButton.addEventListener("click", () => {
      (async () => {
        submitButton.disabled = true;
        uploadButton.disabled = true;
        this.anatomy.unsetErrorState();
        error.classList.remove("active");
        const form = this.anatomy.querySelector("form");
        if (form && filesInput.files && this.apiURL) {
          spinner.classList.add("active");
          const formData = new FormData(form);
          const field = Object.fromEntries(formData.entries());
          const images = [];
          for (const file of filesInput.files) {
            const reader = new FileReader();
            const base64 = await new Promise((r) => {
              reader.addEventListener("load", () => {
                r(reader.result);
              });
              reader.readAsDataURL(file);
            });
            images.push(base64);
          }
          const response = await fetch(this.apiURL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ anatomy: this.anatomy.id, field: field, images: images }),
          });

          if (response.status != 200) {
            console.error(await response.text());
            this.anatomy.setErrorState();
            error.classList.add("active");
            spinner.classList.remove("active");
            return;
          }
          const data = (await response.json()) as Record<string, unknown>;
          if (!isValidResponse(data)) {
            return;
          }
          this.anatomy.processResponse(data.data);
          spinner.classList.remove("active");
        }
      })()
        .catch(console.error)
        .finally(() => {
          submitButton.disabled = false;
          uploadButton.disabled = false;
        });
    });

    uploadButton.addEventListener("click", () => {
      try {
        filesInput.click();
      } catch (err) {
        console.error(err);
      }
    });

    filesInput.addEventListener("change", () => {
      try {
        rightPanel.replaceChildren();
        if (filesInput.files) {
          for (const file of filesInput.files) {
            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            rightPanel.appendChild(img);
          }
        }
      } catch (err) {
        console.error(err);
      }
    });

    select.addEventListener("change", () => {
      try {
        const anatomy = leftPanel.querySelector(".anatomy");
        if (!anatomy) {
          return;
        }
        if (select.value == "distilled-spirits") {
          this.anatomy.setAnatomyLabelType("Distilled Spirits");
        } else if (select.value == "beer") {
          this.anatomy.setAnatomyLabelType("Beer");
        } else if (select.value == "wine") {
          this.anatomy.setAnatomyLabelType("Wine");
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  disconnectedCallback() {
    console.log("Custom element removed from page.");
  }

  connectedMoveCallback() {
    console.log("Custom element moved with moveBefore()");
  }

  adoptedCallback() {
    console.log("Custom element moved to new page.");
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    try {
      console.log(`Attribute ${name} has changed: ${oldValue} -> ${newValue}.`);
      if (name == "api-url") {
        this.apiURL = newValue;
      }
    } catch (err) {
      console.error(err);
    }
  }
}

customElements.define("label-verification", LabelVerificationElement);
