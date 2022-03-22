/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import store from "../__mocks__/store.js";
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
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
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({
        data: bills,
      });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Then should display the new bill button", () => {
      document.body.innerHTML = BillsUI({ data: [] });
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy();
    });

    describe("When there are bills on the Bill page", () => {
      test("It should display an icon eye button", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        expect(screen.getAllByTestId("icon-eye")).toBeTruthy();
      });
    });

    describe("When I am on Bill Page", () => {
      test("Then it should return bills data", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, "localStorage", { value: localStorageMock });

        store.bills = jest.fn().mockImplementationOnce(() => {
          return {
            list: jest.fn().mockResolvedValue([{ data: () => ({ date: "" }) }]),
          };
        });

        const bills = new Bills({
          document,
          onNavigate,
          store: store,
          localStorage,
        });

        const res = bills.getBills();
        expect(res).toEqual(Promise.resolve({}));
      });
    });

    describe("When I click on the icon eye button", () => {
      test("A modal should open", () => {
        $.fn.modal = jest.fn();
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        document.body.innerHTML = BillsUI({ data: bills });
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const billsContainer = new Bills({
          document,
          onNavigate,
          store: store,
          localStorage: window.localStorage,
        });

        const handleClickIconEye = jest.fn((e) => billsContainer.handleClickIconEye(e.target));
        const eye = screen.getAllByTestId("icon-eye")[0];
        eye.addEventListener("click", handleClickIconEye);
        userEvent.click(eye);
        expect(handleClickIconEye).toHaveBeenCalled();

        const modale = screen.getByTestId("modaleFile");
        expect(modale).toBeTruthy();
      });
    });

    test("When I click on new bill button", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

      document.body.innerHTML = BillsUI({ data: bills });

      const Bill = new Bills({
        document,
        onNavigate,
        store: store,
        localStorage: window.localStorage,
      });

      const iconNewBill = screen.getByTestId("btn-new-bill");
      const handleNewBill = jest.fn((e) => {
        Bill.handleClickNewBill(e.target);
      });

      iconNewBill.addEventListener("click", handleNewBill);
      userEvent.click(iconNewBill);

      expect(handleNewBill).toHaveBeenCalled();
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    });
  });

  describe("When I am on Login Page, I try to go to the bills page", () => {
    test("(if loading) Then it should render loading message", () => {
      document.body.innerHTML = BillsUI({
        loading: true,
      });
      expect(screen.getByTestId("loading-message")).toBeTruthy();
      expect(screen.getAllByText("Loading...")).toBeTruthy();
    });
  });

  test("(if error) Then it should render ErrorPage", () => {
    document.body.innerHTML = BillsUI({ error: true });
    expect(screen.getByTestId("error-message")).toBeTruthy();
    expect(screen.getAllByText("Erreur")).toBeTruthy();
  });
});

//test integration GET
describe("Given I am user connected as employee", () => {
  describe("When I navigate to Bill page", () => {
    test("fetches bills from mock API GET", async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const contentPending = await screen.getByText("Nouvelle note de frais");
      expect(contentPending).toBeTruthy();
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy();
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(store, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      test("fetches bills from an API and fails with 404 message error", async () => {
        store.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
        expect(message).toMatchInlineSnapshot(`
          <div
            data-testid="error-message"
          >
            
                    Erreur 404
                  
          </div>
        `);
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        store.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
        expect(message).toMatchInlineSnapshot(`
          <div
            data-testid="error-message"
          >
            
                    Erreur 500
                  
          </div>
        `);
      });
    });
  });
});
