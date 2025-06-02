import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	value: {
		token: '',
		avatar: '',
		username: '',
		scenario: '',
		userID: '',
		scenarioID: '',
		scoreSession: '',
		timer: '',
	}
};
///////////////////////////////////////////DISPATCH NOM SCENARIO AU CLICK SUR MODAL SELECTIONNEEE DANS GEOLOC //////////////////////////////////////////////////////////////

export const usersSlice = createSlice({
	name: 'users',

	initialState,
	reducers: {
		addUserToStore: (state, action) => {
			console.log("payload sent to redux", action.payload);

			state.value = { ...state.value, ...action.payload };
		},

		userLogout: (state) => {
			state.value.token = '';// rappel il faut supprimer le token dans la BDD
		},

	},
},
);

export const { addUserToStore, userLogout, addScenario } = usersSlice.actions;
export default usersSlice.reducer;





