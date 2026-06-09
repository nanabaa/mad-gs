AgroOrbit Link - MOBILE APPLICATION DEVELOPMENT GLOBL SOLUTION

Link do repositório: https://github.com/nanabaa/mad-gs.git
Link do pitch: 
Grupo: Ana Clara de Oliveira Nascimento | RM 561957
Isis Macedo | RM 561497
Henrique Pereira | RM 565608
Pedro Mariutti | RM 75999
Rafael Carvalho Meireles | RM 563413

O **AgroOrbit Link** é uma plataforma de agricultura de precisão que conecta exploração espacial a soluções reais para o campo. O projeto foca na **economia de água** e na **otimização do plantio**, utilizando dados de sensores IoT (ESP32) integrados a satélites da NASA e ESA para análise do solo.

Este repositório contém a **solução mobile com 5 telas para usuário final**, desenvolvido em **React Native com TypeScript**, que exibe gráficos das plantações em tempo real, envia alertas preditivos (ex.: risco de geada nas próximas 48h) e gerencia o CRUD de áreas plantadas.

---

## Funcionalidades do App (Mobile)

- **Dashboard com gráficos** das condições do solo (umidade, temperatura)
- **Alertas preditivos** baseados em dados de satélite (geada, chuva iminente)
- **CRUD de solo para plantio** (cadastro, edição, exclusão e visualização)
- **Integração com API** que cruza dados do ESP32 e satélites
- **Bloqueio inteligente de irrigação** quando há previsão de chuva
- **Recomendação da melhor época de plantio** por cultura

---

## Estrutura de Pastas

Repositório original: https://github.com/nanabaa/mad-gs

mad-gs/ 
└── mad/ 
│ ├── src/ 
| │ ├── screens/ 
| │ │ ├── AlertsScreen.tsx 
│ | │ ├── HistoryReportsScreen.tsx 
| | | ├── HomeScreen.tsx 
│ │ | ├── LeituraFormScreen.tsx 
│ │ | ├── LeituraScreen.tsx 
│ | ├── services/ 
│ │ | ├── api.ts
│ │ | ├── storage.ts
│ | ├── types/ 
│ │ | ├── navigation.ts
| └── app.json
| └── App.tsx
| └── index.ts
| └── LICENSE
| └── package-lock.json
| └── package.json
| └── tsconfig.json
└── README.md

 ## Como executar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Expo CLI](https://docs.expo.dev/) (caso o projeto use Expo)
- Emulador Android/iOS ou dispositivo físico com app Expo Go

### Passo a passo

1. **Clone o repositório**

bash:
git clone https://github.com/nanabaa/mad-gs.git
cd mad-gs/mad

2. **Acesse o cmd pela pasta e instale as dependencias**
npx expo install react-dom react-native-web
 
npm install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context axios @react-native-async-storage/async-storage react-native-gesture-handler

3. **Acesse pelo navegador**

npm run web:	Executa o app no navegador
npm run android:	Executa no Android (emulador ou físico)
npm run ios:	Executa no iOS (apenas Mac)

***Como o sistema funciona (visão geral)***
- ESP32 (IoT) coleta localmente umidade e temperatura do solo.
- API central envia esses dados para a nuvem (Docker + Oracle).
- Satélites (NASA/ESA) fornecem previsões meteorológicas e risco de geada.
- O sistema cruza os dados:
- Se solo precisa irrigar mas satélite prevê chuva → irrigação bloqueada.
- Se risco de geada nas próximas 48h → alerta ao fazendeiro via app.
- O fazendeiro visualiza tudo em tempo real no app e pode gerenciar suas áreas plantadas.

Home:
<img width="312" height="679" alt="image" src="https://github.com/user-attachments/assets/5ac0eaef-f730-4cc2-a8af-d8f50d9c9783" />

Tela de relatórios:
<img width="316" height="684" alt="image" src="https://github.com/user-attachments/assets/80cc04ee-2840-4932-a1d9-3c5116730201" />

Tela de leituras do solo:
<img width="326" height="681" alt="image" src="https://github.com/user-attachments/assets/c6a0a5e2-3633-4f28-a8a8-135284fbd0d3" />

Tela de alertas:
<img width="314" height="578" alt="image" src="https://github.com/user-attachments/assets/1989abcd-0201-435c-ae93-f697d01d92f3" />

Tela de criação de leituras do solo:
<img width="321" height="683" alt="image" src="https://github.com/user-attachments/assets/2b55be03-3846-4977-b9b0-a6048b31fa9c" />

***Tecnologias utilizadas***
- React Native + TypeScript
- Expo (para desenvolvimento rápido)
- Axios (requisições à API)
- React Navigation (rotas)
- React Native Chart Kit (gráficos)
- WebSocket (dados em tempo real do ESP32)
- Docker + Oracle DB + Java (backend)
