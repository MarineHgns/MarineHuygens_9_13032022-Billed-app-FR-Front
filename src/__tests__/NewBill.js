/**
 * @jest-environment jsdom
 */

import NewBillUI from "../views/NewBillUI.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { screen, waitFor, fireEvent } from "@testing-library/dom";
import router from "../app/Router";
import { bills } from "../fixtures/bills";
import user from "@testing-library/user-event";
import store from "../__mocks__/store.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      document.body.innerHTML = NewBillUI();

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const windowIcon = screen.getByTestId("icon-mail");
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
  });

  describe("When I am on NewBill Page", () => {
    test("Then it should render the new bill form", () => {
      document.body.innerHTML == NewBillUI();

      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
      expect(screen.getAllByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getAllByTestId("expense-type")).toBeTruthy();
      expect(screen.getAllByTestId("expense-name")).toBeTruthy();
      expect(screen.getAllByTestId("datepicker")).toBeTruthy();
      expect(screen.getAllByTestId("amount")).toBeTruthy();
      expect(screen.getAllByTestId("vat")).toBeTruthy();
      expect(screen.getAllByTestId("pct")).toBeTruthy();
      expect(screen.getAllByTestId("commentary")).toBeTruthy();
      expect(screen.getAllByTestId("file")).toBeTruthy();
      expect(screen.getAllByRole("button")).toBeTruthy();
    });

    test("Then I can select and upload jpg/jpeg/png files", () => {
      document.body.innerHTML = NewBillUI();

      const store = null;
      const onNavigate = (pathname) => {
        document.body.innerHTML = pathname;
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      });

      const handleChangeFileMock = jest.fn((e) => newBill.handleChangeFile(e));
      const inputUploadFiles = screen.getByTestId("file");
      expect(inputUploadFiles).toBeTruthy();

      inputUploadFiles.addEventListener("change", handleChangeFileMock);
      fireEvent.change(inputUploadFiles, {
        target: {
          files: [
            new File(["file.jpg"], "file.jpg", { type: "file/jpg" }),
            new File(["file.jpeg"], "file.jpeg", { type: "file/jpeg" }),
            new File(["file.png"], "file.png", { type: "file/png" }),
          ],
        },
      });

      expect(handleChangeFileMock).toHaveBeenCalled();
      expect(inputUploadFiles.files[0].name).toBe("file.jpg");
      expect(inputUploadFiles.files[1].name).toBe("file.jpeg");
      expect(inputUploadFiles.files[2].name).toBe("file.png");
      user.upload(inputUploadFiles, "file.jpg");
      user.upload(inputUploadFiles, "file.jpeg");
      user.upload(inputUploadFiles, "file.png");
    });

    test("Then I can't select and upload files who hasn't a valid format", () => {
      document.body.innerHTML = NewBillUI();

      const store = null;
      const onNavigate = (pathname) => {
        document.body.innerHTML = pathname;
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      });

      const handleChangeFileMock = jest.fn((e) => newBill.handleChangeFile(e));
      const inputUploadFiles = screen.getByTestId("file");
      expect(inputUploadFiles).toBeTruthy();

      inputUploadFiles.addEventListener("change", handleChangeFileMock);
      fireEvent.change(inputUploadFiles, {
        target: {
          files: [new File(["file.pdf"], "file.pdf", { type: "file/pdf" })],
        },
      });

      expect(handleChangeFileMock).toHaveBeenCalled();
      expect(inputUploadFiles.files[0].name).not.toBe("file.jpg");
      expect(inputUploadFiles.files[0].name).not.toBe("file.jpeg");
      expect(inputUploadFiles.files[0].name).not.toBe("file.png");
      const file = screen.getByTestId("file");
      expect(file.value).toBe("");
      expect(screen.getAllByTestId("errorFormatImg"));
    });
  });
});

// test intégration Post

describe("Given I am a user connected as Employee", () => {
  describe("When I submit the form completed", () => {
    test("Then the bill should be created", async () => {
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "user@billed.com",
        })
      );

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const billTest = {
        type: "Transport",
        name: "Vol Nice Paris",
        date: "2022-03-17",
        amount: 50,
        vat: 5,
        pct: 2,
        commentary: "some commentary",
        fileUrl: "../picture/0.jpg",
        fileName: "ticket.jpg",
        status: "pending",
      };

      screen.getByTestId("expense-type").value = billTest.type;
      screen.getByTestId("expense-name").value = billTest.name;
      screen.getByTestId("datepicker").value = billTest.date;
      screen.getByTestId("amount").value = billTest.amount;
      screen.getByTestId("vat").value = billTest.vat;
      screen.getByTestId("pct").value = billTest.pct;
      screen.getByTestId("commentary").value = billTest.commentary;

      newBill.fileName = billTest.fileName;
      newBill.fileUrl = billTest.fileUrl;

      newBill.updateBill = jest.fn();
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      const formBill = screen.getByTestId("form-new-bill");
      formBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formBill);

      expect(handleSubmit).toHaveBeenCalled();
      expect(newBill.updateBill).toHaveBeenCalled();
    });

    test("fetches error from an API and fails with 500 error", async () => {
      jest.spyOn(store, "bills");
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();

      const newBill = new NewBill({ document, onNavigate, store: store, localStorage: window.localStorage });

      store.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.NewBill);
      await new Promise(process.nextTick);
      const formBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      formBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formBill);
    });
  });
});
